import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { presentOrder } from "@/lib/orders";
import { presentProduct } from "@/lib/catalog";
import { listOrders, productFromRow } from "@/lib/postgres";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) {
    return response;
  }

  const sql = db();

  const [productCounts, userCounts, orderCounts, revenueRows, lowStock, recentOrders] = await Promise.all([
    sql`SELECT count(*)::int AS count FROM products WHERE active = true`,
    sql`SELECT count(*)::int AS count FROM users`,
    sql`SELECT count(*)::int AS count FROM orders`,
    sql`SELECT COALESCE(sum(total_in_paise), 0)::int AS total FROM orders WHERE status = 'paid'`,
    sql`
      SELECT id, title, slug, description, price_in_paise, category, image, images, stock, active, tags, created_at, updated_at
      FROM products
      WHERE active = true AND stock <= 15
      ORDER BY stock ASC
      LIMIT 8
    `,
    listOrders({ limit: 8 }),
  ]);

  return Response.json({
    products: productCounts[0]?.count || 0,
    users: userCounts[0]?.count || 0,
    orders: orderCounts[0]?.count || 0,
    revenue: (revenueRows[0]?.total || 0) / 100,
    revenueInPaise: revenueRows[0]?.total || 0,
    lowStock: lowStock.map(productFromRow).map(presentProduct),
    recentOrders: recentOrders.map(presentOrder),
  });
}
