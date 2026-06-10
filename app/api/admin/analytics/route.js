import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { user, response } = await requireAdmin();
    if (response) return response;

    const sql = db();

    const [
      revenueByMonth,
      ordersByMonth,
      usersByMonth,
      topProducts,
      topSellers,
      categoryStats,
      recentRevenue,
      orderStatusBreakdown,
      sellerStats,
    ] = await Promise.all([
      // Revenue by month (last 12 months)
      sql`
        SELECT 
          to_char(created_at, 'YYYY-MM') AS month,
          COALESCE(sum(total_in_paise) FILTER (WHERE status = 'paid'), 0)::int AS revenue_in_paise,
          count(*)::int AS order_count
        FROM orders
        WHERE created_at >= now() - interval '12 months'
        GROUP BY to_char(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `,

      // Orders by month
      sql`
        SELECT 
          to_char(created_at, 'YYYY-MM') AS month,
          count(*)::int AS total_orders,
          count(*) FILTER (WHERE status = 'paid')::int AS paid_orders,
          count(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_orders
        FROM orders
        WHERE created_at >= now() - interval '12 months'
        GROUP BY to_char(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `,

      // Users by month
      sql`
        SELECT 
          to_char(created_at, 'YYYY-MM') AS month,
          count(*)::int AS new_users
        FROM users
        WHERE created_at >= now() - interval '12 months'
        GROUP BY to_char(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `,

      // Top products by revenue
      sql`
        SELECT 
          p.id, p.title, p.category, p.image, p.price_in_paise, p.stock, p.active,
          count(oi.id)::int AS times_sold,
          COALESCE(sum(oi.price_in_paise * oi.quantity), 0)::int AS total_revenue_in_paise
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'paid'
        WHERE p.active = true
        GROUP BY p.id, p.title, p.category, p.image, p.price_in_paise, p.stock, p.active
        ORDER BY total_revenue_in_paise DESC
        LIMIT 10
      `,

      // Top sellers by earnings
      sql`
        SELECT 
          s.id, s.shop_name, s.shop_slug, s.verification_status,
          count(DISTINCT sp.product_id)::int AS product_count,
          COALESCE(s.total_earnings, 0)::numeric AS total_earnings,
          s.followers_count,
          s.performance_score
        FROM sellers s
        LEFT JOIN seller_products sp ON sp.seller_id = s.id
        WHERE s.verification_status = 'verified'
        GROUP BY s.id, s.shop_name, s.shop_slug, s.verification_status, s.total_earnings, s.followers_count, s.performance_score
        ORDER BY s.total_earnings DESC
        LIMIT 10
      `,

      // Category breakdown
      sql`
        SELECT 
          category,
          count(*)::int AS product_count,
          count(*) FILTER (WHERE active = true)::int AS active_count,
          COALESCE(avg(price_in_paise), 0)::int AS avg_price_in_paise
        FROM products
        GROUP BY category
        ORDER BY product_count DESC
      `,

      // Recent 30 days revenue
      sql`
        SELECT 
          COALESCE(sum(total_in_paise) FILTER (WHERE status = 'paid' AND created_at >= now() - interval '30 days'), 0)::int AS last_30_days,
          COALESCE(sum(total_in_paise) FILTER (WHERE status = 'paid' AND created_at >= now() - interval '7 days'), 0)::int AS last_7_days,
          COALESCE(sum(total_in_paise) FILTER (WHERE status = 'paid' AND created_at >= now() - interval '1 day'), 0)::int AS last_1_day
        FROM orders
      `,

      // Order status breakdown
      sql`
        SELECT 
          status,
          count(*)::int AS count
        FROM orders
        GROUP BY status
      `,

      // Seller stats
      sql`
        SELECT 
          verification_status,
          count(*)::int AS count
        FROM sellers
        GROUP BY verification_status
      `
    ]);

    return NextResponse.json({
      revenueByMonth: revenueByMonth.map(r => ({
        month: r.month,
        revenue: r.revenue_in_paise / 100,
        orders: r.order_count,
      })),
      ordersByMonth: ordersByMonth.map(r => ({
        month: r.month,
        total: r.total_orders,
        paid: r.paid_orders,
        cancelled: r.cancelled_orders,
      })),
      usersByMonth: usersByMonth.map(r => ({
        month: r.month,
        users: r.new_users,
      })),
      topProducts: topProducts.map(p => ({
        _id: p.id,
        title: p.title,
        category: p.category,
        image: p.image,
        price: p.price_in_paise / 100,
        stock: p.stock,
        active: p.active,
        timesSold: p.times_sold,
        totalRevenue: p.total_revenue_in_paise / 100,
      })),
      topSellers: topSellers.map(s => ({
        _id: s.id,
        shopName: s.shop_name,
        shopSlug: s.shop_slug,
        verificationStatus: s.verification_status,
        productCount: s.product_count,
        totalEarnings: Number(s.total_earnings) || 0,
        followersCount: s.followers_count,
        performanceScore: Number(s.performance_score) || 0,
      })),
      categoryStats: categoryStats.map(c => ({
        category: c.category,
        productCount: c.product_count,
        activeCount: c.active_count,
        avgPrice: c.avg_price_in_paise / 100,
      })),
      recentRevenue,
      orderStatusBreakdown: orderStatusBreakdown.map(r => ({ status: r.status, count: r.count })),
      sellerStats: sellerStats.map(r => ({ status: r.verification_status, count: r.count })),
    });
  } catch (error) {
    console.error("GET /api/admin/analytics failed:", error.message);
    return NextResponse.json({}, { status: 200 });
  }
}