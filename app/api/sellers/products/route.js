import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { presentProduct } from "@/lib/catalog";
import { productFromRow } from "@/lib/postgres";
import { invalidateProductCache } from "@/lib/cache";
import { ensureDatabaseSchema } from "@/lib/schema";

export async function GET(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const sql = db();
  const [seller] = await sql`SELECT id FROM sellers WHERE user_id = ${user._id}`;
  if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  const [{ count }] = await sql`
    SELECT COUNT(*) as count
    FROM seller_products sp
    JOIN products p ON p.id = sp.product_id
    WHERE sp.seller_id = ${seller.id}
  `;

  const rows = await sql`
    SELECT p.id, p.title, p.slug, p.description, p.price_in_paise, p.category, p.image, p.images, p.stock, p.active, p.tags, p.created_at, p.updated_at,
           sp.seller_price_in_paise, sp.stock as seller_stock, sp.fulfillment_type
    FROM seller_products sp
    JOIN products p ON p.id = sp.product_id
    WHERE sp.seller_id = ${seller.id}
    ORDER BY p.created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const products = rows.map(row => ({
    ...presentProduct(productFromRow(row)),
    sellerPrice: row.seller_price_in_paise / 100,
    sellerStock: row.seller_stock,
    fulfillmentType: row.fulfillment_type,
  }));

  return Response.json({ products, pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) } });
}

export async function POST(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const sql = await db();
    const [seller] = await sql`SELECT id, subscription_plan FROM sellers WHERE user_id = ${user._id}`;
    if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

    const { title, description, price, category, stock, image, images, tags } = await request.json();
    if (!title || !price) return Response.json({ message: "Title and price required" }, { status: 400 });

    // Check product limit for basic plan
    if (seller.subscription_plan === 'basic') {
      const [{ count }] = await sql`SELECT COUNT(*) as count FROM seller_products WHERE seller_id = ${seller.id}`;
      if (Number(count) >= 10) return Response.json({ message: "Free plan limited to 10 products. Upgrade to Pro" }, { status: 403 });
    }

    await ensureDatabaseSchema();
    const priceInPaise = Math.round(Number(price) * 100);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const productImage = image || images?.[0]?.url || "";

    // Create or find existing product
    let [product] = await sql`
      INSERT INTO products (title, slug, description, price_in_paise, category, image, images, stock, active, tags)
      VALUES (${title}, ${slug}, ${description || ""}, ${priceInPaise}, ${category || "General"}, ${productImage}, ${JSON.stringify(images || [])}::jsonb, ${Number(stock) || 0}, true, ${tags || []})
      RETURNING id, title, slug, description, price_in_paise, category, image, images, stock, active, tags, created_at, updated_at
    `;

    // Link to seller
    await sql`
      INSERT INTO seller_products (product_id, seller_id, seller_price_in_paise, stock)
      VALUES (${product.id}, ${seller.id}, ${priceInPaise}, ${Number(stock) || 0})
      ON CONFLICT (product_id, seller_id) DO UPDATE SET seller_price_in_paise = EXCLUDED.seller_price_in_paise, stock = EXCLUDED.stock, updated_at = now()
    `;

    await sql`
      INSERT INTO inventory (product_id, quantity_on_hand)
      VALUES (${product.id}, ${Number(stock) || 0})
      ON CONFLICT (product_id) DO UPDATE SET quantity_on_hand = EXCLUDED.quantity_on_hand, updated_at = now()
    `;

    invalidateProductCache();
    return Response.json({ product: presentProduct(productFromRow(product)) }, { status: 201 });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}