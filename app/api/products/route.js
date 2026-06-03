import { db } from "@/lib/db";
import { createEmbedding, productText } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";
import { presentProduct, productPayload } from "@/lib/catalog";
import { productFromRow } from "@/lib/postgres";

export async function GET(request) {
  try {
    const sql = db();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const category = searchParams.get("category")?.trim();
    const includeInactive = searchParams.get("includeInactive") === "true";
    const pattern = `%${query || ""}%`;
    const rows = await sql`
      SELECT id, title, slug, description, price_in_paise, category, image, images, stock, active, tags, created_at, updated_at
      FROM products
      WHERE (${includeInactive} OR active = true)
        AND (${!category} OR category = ${category})
        AND (
          ${!query}
          OR title ILIKE ${pattern}
          OR description ILIKE ${pattern}
          OR category ILIKE ${pattern}
          OR EXISTS (SELECT 1 FROM unnest(tags) tag WHERE tag ILIKE ${pattern})
        )
      ORDER BY created_at DESC
      LIMIT 60
    `;
    return Response.json({ products: rows.map(productFromRow).map(presentProduct), mode: query ? "keyword" : "catalog" });
  } catch (error) {
    return Response.json({ message: "Unable to load products", error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { response } = await requireAdmin();
    if (response) {
      return response;
    }

    const body = await request.json();
    const payload = productPayload(body);
    if (!payload.title || !payload.priceInPaise) {
      return Response.json({ message: "Title and price are required" }, { status: 400 });
    }

    const embedding = await createEmbedding(productText(payload));

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

    return Response.json({ product: presentProduct(productFromRow(product)) }, { status: 201 });
  } catch (error) {
    return Response.json({ message: "Unable to create product", error: error.message }, { status: 500 });
  }
}
