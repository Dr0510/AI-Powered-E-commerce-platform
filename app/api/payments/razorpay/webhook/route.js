import { db } from "@/lib/db";
import { markOrderPaid, presentOrder } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { getOrderById, getOrderByRazorpayOrderId } from "@/lib/postgres";

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const eventId = request.headers.get("x-razorpay-event-id");

  try {
    if (!signature || !verifyWebhookSignature(body, signature)) {
      return Response.json({ message: "Invalid webhook signature" }, { status: 400 });
    }
    if (!eventId) {
      return Response.json({ message: "Missing Razorpay event id" }, { status: 400 });
    }

    const sql = db();
    const [existing] = await sql`SELECT id FROM webhook_events WHERE event_id = ${eventId} LIMIT 1`;
    if (existing) {
      return Response.json({ message: "Duplicate webhook ignored" });
    }

    const payload = JSON.parse(body);
    await sql`
      INSERT INTO webhook_events (event_id, event, processed_at)
      VALUES (${eventId}, ${payload.event}, now())
    `;

    const payment = payload.payload?.payment?.entity;
    if (!payment || !["payment.captured", "payment.authorized"].includes(payload.event)) {
      return Response.json({ message: "Webhook accepted" });
    }

    const localOrderId = payment.notes?.localOrderId;
    const order = localOrderId
      ? await getOrderById(localOrderId)
      : await getOrderByRazorpayOrderId(payment.order_id);
    if (!order) {
      return Response.json({ message: "Order not found for webhook" }, { status: 202 });
    }

    await markOrderPaid(order, {
      razorpayOrderId: payment.order_id,
      razorpayPaymentId: payment.id,
    });

    return Response.json({ order: presentOrder(order) });
  } catch (error) {
    return Response.json({ message: "Webhook failed", error: error.message }, { status: 500 });
  }
}
