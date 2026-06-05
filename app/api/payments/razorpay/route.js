import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { normalizePaise } from "@/lib/format";
import { markOrderPaid, presentOrder } from "@/lib/orders";
import { razorpayClient, razorpayCredentials, verifyPaymentSignature } from "@/lib/razorpay";
import { getOrderById } from "@/lib/postgres";
import { withRateLimit } from "@/lib/rateLimit";

async function postHandler(request) {
  try {
    const { user, response } = await requireUser();
    if (response) {
      return response;
    }

    const { orderId } = await request.json();
    const { keyId } = razorpayCredentials();

    const sql = db();
    const order = await getOrderById(orderId, user._id);
    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }
    if (order.status === "paid") {
      return Response.json({ message: "Order is already paid" }, { status: 409 });
    }

    const amountInPaise = Math.max(100, normalizePaise(order.totalInPaise));
    const razorpayOrder = await razorpayClient().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `dr_${order._id.toString().slice(-12)}`,
      notes: {
        localOrderId: order._id.toString(),
        userId: user._id.toString(),
      },
    });

    await sql`UPDATE orders SET status = 'payment_pending', updated_at = now() WHERE id = ${order._id}`;
    await sql`
      INSERT INTO payments (order_id, provider, razorpay_order_id, currency, amount_in_paise, status)
      VALUES (${order._id}, 'razorpay', ${razorpayOrder.id}, 'INR', ${amountInPaise}, 'created')
      ON CONFLICT (order_id)
      DO UPDATE SET
        razorpay_order_id = EXCLUDED.razorpay_order_id,
        amount_in_paise = EXCLUDED.amount_in_paise,
        status = 'created',
        updated_at = now()
    `;

    return Response.json({
      keyId,
      razorpayOrderId: razorpayOrder.id,
      amountInPaise,
      currency: "INR",
      localOrderId: order._id.toString(),
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}

async function putHandler(request) {
  try {
    const { user, response } = await requireUser();
    if (response) {
      return response;
    }

    const {
      localOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json();

    if (!verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature })) {
      return Response.json({ message: "Invalid Razorpay signature" }, { status: 400 });
    }

    const order = await getOrderById(localOrderId, user._id);
    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    const paidOrder = await markOrderPaid(order, { razorpay_order_id, razorpay_payment_id, razorpay_signature });

    return Response.json({ order: presentOrder(paidOrder) });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}

export const POST = withRateLimit(postHandler, { limit: 50, windowMs: 60 * 1000 });
export const PUT = withRateLimit(putHandler, { limit: 50, windowMs: 60 * 1000 });
