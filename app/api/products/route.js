import { db } from "@/lib/db";
import { cacheUtils } from "@/lib/cache";
import { productFromRow } from "@/lib/postgres";

const CACHE_TTL = 30 * 1000; // 30 seconds

export async function GET(request) {
  const cacheKey = `products:${request.url}`;
  const cached = cacheUtils.getCacheEntry(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached.value), {
      status: 200,
      headers: { "Content-Type": "application/json", "X-Cache": "HIT" },
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const active = searchParams.get("active") !== "false";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;
    const includeInactive = searchParams.get("includeInactive") === "true";

    const sql = db();
    let where = sql`WHERE 1=1`;
    if (!includeInactive) {
      where = sql`${where} AND p.active = true`;
    }
    if (category && category !== "All") {
      where = sql`${where} AND p.category = ${category}`;
    }
    if (search) {
      where = sql`${where} AND (p.title ILIKE ${"%" + search + "%"} OR p.description ILIKE ${"%" + search + "%"})`;
    }

    const [{ count }] = await sql`SELECT COUNT(*) as count FROM products p ${where}`;

    const rows = await sql`
      SELECT p.* FROM products p ${where}
      ORDER BY p.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const products = rows.map(r => productFromRow(r));

    const result = { products, pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) } };
    cacheUtils.setCacheEntry(cacheKey, result, CACHE_TTL);
    return Response.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (error) {
    console.error("GET /api/products failed:", error.message);
    return Response.json({ products: [], message: error.message }, { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const sql = db();
    const priceInPaise = Math.round(Number(body.price) * 100);
    const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const [product] = await sql`
      INSERT INTO products (title, slug, description, price_in_paise, category, image, images, stock, active, tags)
      VALUES (${body.title}, ${slug}, ${body.description || ""}, ${priceInPaise}, ${body.category || "General"}, ${body.image || ""}, ${JSON.stringify(body.images || [])}::jsonb, ${Number(body.stock) || 0}, ${body.active !== false}, ${(body.tags || "").split(",").map(t => t.trim()).filter(Boolean)})
      RETURNING *
    `;

    cacheUtils.invalidateByPattern(/^products:/);
    return Response.json({ product: productFromRow(product) }, { status: 201 });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}