import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { presentOrder } from "@/lib/orders";
import { presentProduct } from "@/lib/catalog";
import { listOrders, productFromRow } from "@/lib/postgres";

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) {
      return response;
    }

    const sql = db();

    const [productCounts, userCounts, orderCounts, revenueRows, lowStock, recentOrders, recentUsers] = await Promise.all([
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
      sql`
        SELECT
          u.id,
          u.clerk_id,
          u.name,
          u.email,
          u.role,
          u.created_at,
          u.updated_at,
          count(o.id)::int AS order_count,
          COALESCE(sum(o.total_in_paise) FILTER (WHERE o.status = 'paid'), 0)::int AS total_spent_in_paise
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id
        GROUP BY u.id, u.clerk_id, u.name, u.email, u.role, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT 25
      `,
    ]);

    return Response.json({
      products: productCounts[0]?.count || 0,
      users: userCounts[0]?.count || 0,
      orders: orderCounts[0]?.count || 0,
      revenue: (revenueRows[0]?.total || 0) / 100,
      revenueInPaise: revenueRows[0]?.total || 0,
      lowStock: (lowStock || []).map(productFromRow).map(presentProduct),
      recentOrders: (recentOrders || []).map(presentOrder),
      recentUsers: (recentUsers || []).map((user) => ({
        _id: user.id,
        id: user.id,
        clerkId: user.clerk_id,
        name: user.name,
        email: user.email,
        role: user.role,
        orderCount: Number(user.order_count || 0),
        totalSpentInPaise: Number(user.total_spent_in_paise || 0),
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/stats failed:", error.message);
    return Response.json({ products: 0, users: 0, orders: 0, revenue: 0, revenueInPaise: 0, lowStock: [], recentOrders: [], recentUsers: [] }, { status: 200 });
  }
}