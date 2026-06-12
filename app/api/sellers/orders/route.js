import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { presentOrder } from "@/lib/orders";
import { getOrderById } from "@/lib/postgres";

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const sql = db();
  const [seller] = await sql`SELECT id, shop_name FROM sellers WHERE user_id = ${user._id}`;
  if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

  // Get orders that contain this seller's products
  const orders = await sql`
    SELECT DISTINCT o.id, o.user_id, o.clerk_id, o.customer_name, o.customer_email, o.total_in_paise, o.currency, o.status, o.fulfillment_status, o.stock_adjusted, o.shipping_name, o.shipping_line1, o.shipping_city, o.shipping_country, o.shipping_phone, o.shipping_pincode, o.created_at, o.updated_at
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN seller_products sp ON sp.product_id = oi.product_id
    WHERE sp.seller_id = ${seller.id}
    ORDER BY o.created_at DESC
    LIMIT 100
  `;

  if (orders.length === 0) return Response.json({ orders: [] });

  // Batch-load order items for all orders in a single query
  const orderIds = orders.map(o => o.id);
  const allItems = await sql`
    SELECT oi.*, sp.stock as seller_stock, oi.order_id
    FROM order_items oi
    JOIN seller_products sp ON sp.product_id = oi.product_id
    WHERE oi.order_id = ANY(${orderIds}) AND sp.seller_id = ${seller.id}
  `;

  const itemsByOrderId = {};
  for (const item of allItems) {
    const oid = item.order_id;
    if (!itemsByOrderId[oid]) itemsByOrderId[oid] = [];
    itemsByOrderId[oid].push(item);
  }

  const ordersWithItems = orders.map(order => ({
    ...order,
    items: itemsByOrderId[order.id] || [],
  }));

  return Response.json({ orders: ordersWithItems });
}

export async function PATCH(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const sql = db();
    const [seller] = await sql`SELECT id FROM sellers WHERE user_id = ${user._id}`;
    if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

    const { orderId, fulfillmentStatus } = await request.json();
    if (!orderId || !fulfillmentStatus) {
      return Response.json({ message: "orderId and fulfillmentStatus required" }, { status: 400 });
    }

    const allowedStatuses = ["packed", "shipped", "delivered", "cancelled"];
    if (!allowedStatuses.includes(fulfillmentStatus)) {
      return Response.json({ message: "Invalid status" }, { status: 400 });
    }

    // Verify seller owns ALL products in this order
    const orderItems = await sql`
      SELECT oi.id, oi.product_id FROM order_items oi
      WHERE oi.order_id = ${orderId}
    `;
    if (orderItems.length === 0) return Response.json({ message: "Order not found" }, { status: 404 });

    // Count how many of this order's products belong to this seller
    const [{ owned }] = await sql`
      SELECT COUNT(*)::int as owned FROM order_items oi
      JOIN seller_products sp ON sp.product_id = oi.product_id
      WHERE oi.order_id = ${orderId} AND sp.seller_id = ${seller.id}
    `;
    if (Number(owned) !== orderItems.length) {
      return Response.json({ message: "Not authorized to update this order" }, { status: 403 });
    }

    const [updatedOrder] = await sql`
      UPDATE orders SET fulfillment_status = ${fulfillmentStatus}, updated_at = now() WHERE id = ${orderId} RETURNING id
    `;
    const order = await getOrderById(updatedOrder.id);
    return Response.json({ order: presentOrder(order) });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}