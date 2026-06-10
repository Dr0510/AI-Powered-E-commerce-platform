import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { listOrders } from "@/lib/postgres";
import { presentOrder } from "@/lib/orders";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { user, response } = await requireAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status") || "";
    const fulfillment = searchParams.get("fulfillment") || "";
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    const sql = db();

    let conditions = sql`1=1`;
    if (status) conditions = sql`${conditions} AND o.status = ${status}`;
    if (fulfillment) conditions = sql`${conditions} AND o.fulfillment_status = ${fulfillment}`;
    if (search) {
      conditions = sql`${conditions} AND (
        o.id::text ILIKE ${'%' + search + '%'} OR
        o.customer_name ILIKE ${'%' + search + '%'} OR
        o.customer_email ILIKE ${'%' + search + '%'}
      )`;
    }

    const [ordersResult, countResult] = await Promise.all([
      sql`
        SELECT o.*,
          (SELECT json_agg(json_build_object(
            'id', oi.id,
            'title', oi.title,
            'image', oi.image,
            'price_in_paise', oi.price_in_paise,
            'quantity', oi.quantity
          )) FROM order_items oi WHERE oi.order_id = o.id) AS items
        FROM orders o
        WHERE ${conditions}
        ORDER BY o.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT count(*)::int AS total FROM orders o WHERE ${conditions}
      `
    ]);

    const total = countResult[0]?.total || 0;

    const enrichedOrders = await Promise.all(ordersResult.map(async (order) => {
      const present = presentOrder({
        ...order,
        items: order.items || [],
      });

      let sellerInfo = null;
      try {
        const sellerResult = await sql`
          SELECT s.shop_name, s.id as seller_id
          FROM sellers s
          WHERE s.user_id = ${order.user_id}
          LIMIT 1
        `;
        if (sellerResult[0]) {
          sellerInfo = {
            shopName: sellerResult[0].shop_name,
            sellerId: sellerResult[0].seller_id,
          };
        }
      } catch (e) {}

      return {
        ...present,
        customer: {
          name: order.customer_name || "Customer",
          email: order.customer_email || "",
          userId: order.user_id,
        },
        seller: sellerInfo,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      };
    }));

    return NextResponse.json({
      orders: enrichedOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/admin/orders failed:", error.message);
    return NextResponse.json({ orders: [], total: 0, page: 1, limit: 50, totalPages: 0 }, { status: 200 });
  }
}