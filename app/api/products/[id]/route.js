import { db } from "@/lib/db";
import { createEmbedding, productText } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";
import { presentProduct } from "@/lib/catalog";
import { productFromRow } from "@/lib/postgres";
import { validateProductTitle, validatePrice, validateStock, validateCategory, validateTags } from "@/lib/validation";
import { ValidationError, NotFoundError, logError, errorResponse } from "@/lib/errors";
import { invalidateProductCache } from "@/lib/cache";
import { ensureDatabaseSchema } from "@/lib/schema";

export async function GET(_request, { params }) {
  try {
    await ensureDatabaseSchema();

    const sql = db();
    const { id } = await params;

    const [product] = await sql`
      SELECT id, title, slug, description, price_in_paise, category, image, images, stock, active, tags, created_at, updated_at
      FROM products
      WHERE id = ${id} AND active = true
      LIMIT 1
    `;

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return Response.json({ product: presentProduct(productFromRow(product)) });
  } catch (error) {
    logError("GET /api/products/[id] failed", error);
    if (error.statusCode === 404) {
      return Response.json({ message: error.message }, { status: 404 });
    }
    return errorResponse(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { response } = await requireAdmin();
    if (response) {
      return response;
    }

    const { id } = await params;
    const body = await request.json();

    // Validate fields (allow partial updates)
    const title = body.title ? validateProductTitle(body.title) : null;
    const price = body.price !== undefined ? validatePrice(body.price) : null;
    const category = body.category ? validateCategory(body.category) : null;
    const stock = body.stock !== undefined ? validateStock(body.stock) : null;
    const tags = body.tags ? validateTags(body.tags) : null;

    if (title === false || price === false || stock === false) {
      throw new ValidationError("Invalid field value provided");
    }

    const sql = db();
    const priceInPaise = price !== null ? Math.round(price * 100) : null;
    const description = body.description !== undefined
      ? String(body.description || "").trim().substring(0, 5000)
      : null;
    const hasImages = body.images?.length > 0;
    const image = hasImages ? body.images[0].url : null;
    const images = hasImages ? JSON.stringify(body.images) : null;
    const active = body.active !== undefined ? Boolean(body.active) : null;

    // Try to get embedding if we're updating title/description
    let embedding = null;
    if (title || body.description !== undefined) {
      try {
        embedding = await createEmbedding(productText({
          title: title || body.title,
          description: body.description !== undefined ? body.description : "",
        })).catch(() => null);
      } catch {
        // Embedding generation is optional
      }
    }

    const [product] = await sql`
      UPDATE products
      SET
        title = COALESCE(${title}, title),
        price_in_paise = COALESCE(${priceInPaise}, price_in_paise),
        category = COALESCE(${category}, category),
        stock = COALESCE(${stock}, stock),
        tags = COALESCE(${tags}, tags),
        description = CASE WHEN ${body.description !== undefined} THEN ${description} ELSE description END,
        active = COALESCE(${active}, active),
        image = CASE WHEN ${hasImages} THEN ${image} ELSE image END,
        images = CASE WHEN ${hasImages} THEN ${images}::jsonb ELSE images END,
        embedding = CASE WHEN ${Boolean(embedding)} THEN ${JSON.stringify(embedding || [])}::jsonb ELSE embedding END,
        updated_at = now()
      WHERE id = ${id}
      RETURNING id, title, slug, description, price_in_paise, category, image, images, stock, active, tags, embedding, created_at, updated_at
    `;

    if (!product) throw new NotFoundError("Product not found");
    invalidateProductCache();
    return Response.json({ product: presentProduct(productFromRow(product)) });
  } catch (error) {
    logError("PATCH /api/products/[id] failed", error);
    if (error instanceof ValidationError) {
      return Response.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return Response.json({ message: error.message }, { status: 404 });
    }
    return errorResponse(error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { response } = await requireAdmin();
    if (response) {
      return response;
    }

    const sql = db();
    const { id } = await params;

    const [result] = await sql`
      UPDATE products
      SET active = false, updated_at = now()
      WHERE id = ${id}
      RETURNING id
    `;

    if (!result) throw new NotFoundError("Product not found");
    invalidateProductCache();
    return Response.json({ message: "Product archived successfully" });
  } catch (error) {
    logError("DELETE /api/products/[id] failed", error);
    if (error instanceof NotFoundError) {
      return Response.json({ message: error.message }, { status: 404 });
    }
    return errorResponse(error);
  }
}
