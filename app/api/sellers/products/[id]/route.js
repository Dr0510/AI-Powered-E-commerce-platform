import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { presentProduct } from "@/lib/catalog";
import { productFromRow } from "@/lib/postgres";
import { invalidateProductCache } from "@/lib/cache";

export async function PATCH(request, { params }) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const { id } = await params;
    const sql = db();
    const [seller] = await sql`SELECT id FROM sellers WHERE user_id = ${user._id}`;
    if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

    // Verify ownership
    const [sp] = await sql`SELECT product_id FROM seller_products WHERE product_id = ${id} AND seller_id = ${seller.id}`;
    if (!sp) return Response.json({ message: "Product not found" }, { status: 404 });

    const body = await request.json();
    const updates = {};

    if (body.title) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.price) {
      updates.price_in_paise = Math.round(Number(body.price) * 100);
    }
    if (body.category) updates.category = body.category;
    if (body.stock !== undefined) {
      updates.seller_stock = Number(body.stock);
      updates.stock = Number(body.stock);
    }
    if (body.images?.length) {
      updates.image = body.images[0].url;
      updates.images = JSON.stringify(body.images);
    }
    if (body.tags) updates.tags = body.tags;
    if (body.active !== undefined) updates.active = Boolean(body.active);
    if (body.fulfillmentType) updates.fulfillment_type = body.fulfillmentType;

    // Update product with explicit column assignments
    if (updates.title !== undefined || updates.description !== undefined || updates.price_in_paise !== undefined || updates.category !== undefined || updates.stock !== undefined || updates.image !== undefined || updates.images !== undefined || updates.tags !== undefined || updates.active !== undefined) {
      await sql`
        UPDATE products SET
          title = COALESCE(${updates.title || null}, title),
          description = COALESCE(${updates.description !== undefined ? updates.description : null}, description),
          price_in_paise = COALESCE(${updates.price_in_paise || null}, price_in_paise),
          category = COALESCE(${updates.category || null}, category),
          stock = COALESCE(${updates.stock !== undefined ? updates.stock : null}, stock),
          image = COALESCE(${updates.image || null}, image),
          tags = COALESCE(${updates.tags || null}, tags),
          active = COALESCE(${updates.active !== undefined ? updates.active : null}, active),
          updated_at = now()
        WHERE id = ${id}
      `;
    }

    // Update seller_product record
    await sql`
      UPDATE seller_products SET seller_price_in_paise = COALESCE(${updates.price_in_paise || null}, seller_price_in_paise), stock = COALESCE(${updates.seller_stock !== undefined ? updates.seller_stock : null}, stock), fulfillment_type = COALESCE(${updates.fulfillment_type || null}, fulfillment_type), updated_at = now() WHERE product_id = ${id} AND seller_id = ${seller.id}
    `;

    invalidateProductCache();
    const [product] = await sql`SELECT * FROM products WHERE id = ${id}`;
    return Response.json({ product: presentProduct(productFromRow(product)) });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const sql = db();
  const [seller] = await sql`SELECT id FROM sellers WHERE user_id = ${user._id}`;
  if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

  const [sp] = await sql`SELECT product_id FROM seller_products WHERE product_id = ${id} AND seller_id = ${seller.id}`;
  if (!sp) return Response.json({ message: "Product not found" }, { status: 404 });

  await sql`DELETE FROM seller_products WHERE product_id = ${id} AND seller_id = ${seller.id}`;
  await sql`UPDATE products SET active = false, updated_at = now() WHERE id = ${id}`;
  invalidateProductCache();
  return Response.json({ message: "Product removed" });
}