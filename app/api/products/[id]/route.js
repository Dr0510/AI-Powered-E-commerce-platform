import { db } from "@/lib/db";
import { createEmbedding, productText } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";
import { presentProduct, productPayload } from "@/lib/catalog";
import { productFromRow } from "@/lib/postgres";

export async function GET(_request, { params }) {
  const sql = db();
  const { id } = await params;
  const [product] = await sql`
    SELECT id, title, slug, description, price_in_paise, category, image, images, stock, active, tags, created_at, updated_at
    FROM products
    WHERE id = ${id} AND active = true
    LIMIT 1
  `;

  if (!product) {
    return Response.json({ message: "Product not found" }, { status: 404 });
  }

  return Response.json({ product: presentProduct(productFromRow(product)) });
}

export async function PATCH(request, { params }) {
  try {
    const { response } = await requireAdmin();
    if (response) {
      return response;
    }

    const { id } = await params;
    const body = await request.json();
    const update = productPayload(body);

    const embedding = await createEmbedding(productText(update));
    if (embedding) {
      update.embedding = embedding;
    }

    const sql = db();
    const [product] = await sql`
      UPDATE products
      SET title = ${update.title},
        slug = ${update.slug},
        description = ${update.description},
        price_in_paise = ${update.priceInPaise},
        category = ${update.category},
        image = ${update.image},
        images = ${JSON.stringify(update.images)}::jsonb,
        stock = ${update.stock},
        active = ${update.active},
        tags = ${update.tags},
        embedding = ${JSON.stringify(update.embedding || [])}::jsonb,
        updated_at = now()
      WHERE id = ${id}
      RETURNING id, title, slug, description, price_in_paise, category, image, images, stock, active, tags, embedding, created_at, updated_at
    `;
    return Response.json({ product: presentProduct(productFromRow(product)) });
  } catch (error) {
    return Response.json({ message: "Unable to update product", error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const { response } = await requireAdmin();
  if (response) {
    return response;
  }

  const sql = db();
  const { id } = await params;
  await sql`UPDATE products SET active = false, updated_at = now() WHERE id = ${id}`;
  return Response.json({ message: "Product archived" });
}
