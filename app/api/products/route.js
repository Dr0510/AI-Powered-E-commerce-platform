import { db } from "@/lib/db";
import { createEmbedding, productText } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";
import { presentProduct, productPayload } from "@/lib/catalog";
import { productFromRow } from "@/lib/postgres";
import { validateProductTitle, validatePrice, validateStock, validateCategory, validateTags, validateSearchQuery } from "@/lib/validation";
import { ValidationError, logError, errorResponse } from "@/lib/errors";
import { withRateLimit } from "@/lib/rateLimit";
import { cacheMiddleware, invalidateProductCache } from "@/lib/cache";
import { ensureDatabaseSchema } from "@/lib/schema";

// Core GET handler without caching
async function getHandler(request) {
  try {
    await ensureDatabaseSchema();

    const sql = db();
    const { searchParams } = new URL(request.url);
    
    const query = validateSearchQuery(searchParams.get("q"));
    const category = searchParams.get("category")?.trim();
    const includeInactive = searchParams.get("includeInactive") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const pattern = query ? `%${query}%` : null;
    
    // Get total count
    const [{ count }] = await sql`
      SELECT COUNT(*) as count
      FROM products
      WHERE (${includeInactive} OR active = true)
        AND (${!category} OR category = ${category})
        AND (
          ${!pattern}
          OR title ILIKE ${pattern}
          OR description ILIKE ${pattern}
          OR category ILIKE ${pattern}
          OR EXISTS (SELECT 1 FROM unnest(tags) tag WHERE tag ILIKE ${pattern})
        )
    `;

    // Get products
    const rows = await sql`
      SELECT id, title, slug, description, price_in_paise, category, image, images, stock, active, tags, created_at, updated_at
      FROM products
      WHERE (${includeInactive} OR active = true)
        AND (${!category} OR category = ${category})
        AND (
          ${!pattern}
          OR title ILIKE ${pattern}
          OR description ILIKE ${pattern}
          OR category ILIKE ${pattern}
          OR EXISTS (SELECT 1 FROM unnest(tags) tag WHERE tag ILIKE ${pattern})
        )
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return Response.json({
      products: rows.map(productFromRow).map(presentProduct),
      pagination: {
        page,
        limit,
        total: Number(count),
        pages: Math.ceil(Number(count) / limit),
      },
      mode: query ? "keyword" : "catalog",
    });
  } catch (error) {
    logError("GET /api/products failed", error);
    return errorResponse(error);
  }
}

// Wrap GET handler with caching middleware
export const GET = cacheMiddleware(getHandler, {
  keyGenerator: (req) => {
    const url = new URL(req.url);
    return `products:${url.search || '?default'}`;
  },
  ttl: 5 * 60 * 1000, // 5 minutes
});

async function postHandler(request) {
  try {
    const { response } = await requireAdmin();
    if (response) {
      return response;
    }

    const body = await request.json();
    
    // Validate required fields
    const title = validateProductTitle(body.title);
    const price = validatePrice(body.price);
    const category = validateCategory(body.category);
    const stock = validateStock(body.stock);
    const tags = validateTags(body.tags);

    if (!title) {
      throw new ValidationError("Product title is required (2-200 characters)");
    }
    if (price === null || price === undefined || price <= 0) {
      throw new ValidationError("Product price must be greater than 0");
    }
    if (!body.images?.length || !body.images[0]?.url) {
      throw new ValidationError("Product image is required. Upload via Cloudinary");
    }

    const priceInPaise = Math.round(price * 100);
    const payload = {
      title,
      slug: (body.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: String(body.description || "").trim().substring(0, 5000),
      priceInPaise,
      category,
      image: body.images[0].url,
      images: body.images,
      stock,
      active: body.active !== false,
      tags,
    };

    try {
      const embedding = await createEmbedding(productText(payload)).catch(() => []);

      await ensureDatabaseSchema();
      const sql = db();
      const [product] = await sql`
        INSERT INTO products (title, slug, description, price_in_paise, category, image, images, stock, active, tags, embedding)
        VALUES (
          ${payload.title},
          ${payload.slug},
          ${payload.description},
          ${payload.priceInPaise},
          ${payload.category},
          ${payload.image},
          ${JSON.stringify(payload.images)}::jsonb,
          ${payload.stock},
          ${payload.active},
          ${payload.tags},
          ${JSON.stringify(embedding || [])}::jsonb
        )
        RETURNING id, title, slug, description, price_in_paise, category, image, images, stock, active, tags, embedding, created_at, updated_at
      `;
      await sql`
        INSERT INTO inventory (product_id, quantity_on_hand)
        VALUES (${product.id}, ${payload.stock})
        ON CONFLICT (product_id)
        DO UPDATE SET quantity_on_hand = EXCLUDED.quantity_on_hand, updated_at = now()
      `;

      // Invalidate product cache after successful POST
      invalidateProductCache();

      return Response.json({ product: presentProduct(productFromRow(product)) }, { status: 201 });
    } catch (dbError) {
      logError("Database error creating product", dbError);
      throw new Error("Failed to save product to database");
    }
  } catch (error) {
    logError("POST /api/products failed", error);
    
    if (error instanceof ValidationError) {
      return Response.json({ message: error.message }, { status: 400 });
    }
    
    return errorResponse(error);
  }
}

export const POST = withRateLimit(postHandler);
