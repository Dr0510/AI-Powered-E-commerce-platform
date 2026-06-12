import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { cacheUtils } from "@/lib/cache";

const CACHE_TTL = 60 * 1000; // 60 seconds

export async function GET(request, { params }) {
  const { user, response } = await requireUser();
  if (response) return response;

  const cacheKey = `seller:stats:${request.url}`;
  const cached = cacheUtils.getCacheEntry(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached.value), {
      status: 200,
      headers: { "Content-Type": "application/json", "X-Cache": "HIT" },
    });
  }

  const sql = db();
  try {
    const { id } = await params;
    if (!id) return Response.json({ products: 0, orders: 0, revenue: 0, followers: 0, reviews: 0, rating: "0.0" });

    // Ownership check: ensure this seller belongs to the authenticated user
    const [seller] = await sql`SELECT id, user_id FROM sellers WHERE id = ${id}`;
    if (!seller) return Response.json({ products: 0, orders: 0, revenue: 0, followers: 0, reviews: 0, rating: "0.0" });
    if (seller.user_id !== user._id) return Response.json({ products: 0, orders: 0, revenue: 0, followers: 0, reviews: 0, rating: "0.0" });

    const [productCount] = await sql`
      SELECT COUNT(*)::int as count FROM seller_products WHERE seller_id = ${id}
    `;

    const [orderCount] = await sql`
      SELECT COUNT(DISTINCT oi.order_id)::int as count
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN seller_products sp ON sp.product_id = p.id
      WHERE sp.seller_id = ${id}
    `;

    const [revenue] = await sql`
      SELECT COALESCE(SUM(oi.price_in_paise * oi.quantity), 0)::bigint as total
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN seller_products sp ON sp.product_id = p.id
      JOIN orders o ON o.id = oi.order_id
      WHERE sp.seller_id = ${id} AND o.status IN ('paid', 'completed', 'delivered')
    `;

    const [followerCount] = await sql`
      SELECT COUNT(*)::int as count FROM seller_followers WHERE seller_id = ${id}
    `;

    const [reviewData] = await sql`
      SELECT COUNT(*)::int as count, COALESCE(AVG(rating)::float, 0) as avg_rating
      FROM seller_reviews WHERE seller_id = ${id}
    `;

    const result = {
      products: productCount?.count || 0,
      orders: orderCount?.count || 0,
      revenue: revenue?.total || 0,
      followers: followerCount?.count || 0,
      reviews: reviewData?.count || 0,
      rating: Number(reviewData?.avg_rating || 0).toFixed(1),
    };

    cacheUtils.setCacheEntry(cacheKey, result, CACHE_TTL);
    return Response.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (error) {
    console.error("GET /api/sellers/[id]/stats failed:", error.message);
    return Response.json({ products: 0, orders: 0, revenue: 0, followers: 0, reviews: 0, rating: "0.0" });
  }
}
