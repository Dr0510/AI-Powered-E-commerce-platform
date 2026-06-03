import connectDB from "@/lib/db";
import { markOrderPaid, presentOrder } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";
import Order from "@/models/Order";
import WebhookEvent from "@/models/WebhookEvent";

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

    await connectDB();
    const existing = await WebhookEvent.findOne({ eventId });
    if (existing) {
      return Response.json({ message: "Duplicate webhook ignored" });
    }

    const payload = JSON.parse(body);
    await WebhookEvent.create({
      eventId,
      event: payload.event,
      processedAt: new Date(),
    });

    const payment = payload.payload?.payment?.entity;
    if (!payment || !["payment.captured", "payment.authorized"].includes(payload.event)) {
      return Response.json({ message: "Webhook accepted" });
    }

    const localOrderId = payment.notes?.localOrderId;
    const query = localOrderId
      ? { _id: localOrderId }
      : { "payment.razorpayOrderId": payment.order_id };
    const order = await Order.findOne(query);
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
