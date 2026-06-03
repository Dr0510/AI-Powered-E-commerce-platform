import connectDB from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { markOrderPaid, presentOrder } from "@/lib/orders";
import { razorpayClient, razorpayCredentials, verifyPaymentSignature } from "@/lib/razorpay";
import Order from "@/models/Order";

export async function POST(request) {
  try {
    const { user, response } = await requireUser();
    if (response) {
      return response;
    }

    const { orderId } = await request.json();
    const { keyId } = razorpayCredentials();

    await connectDB();
    const order = await Order.findOne({ _id: orderId, user: user._id });
    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }
    if (order.status === "paid") {
      return Response.json({ message: "Order is already paid" }, { status: 409 });
    }

    const amountInPaise = Math.max(100, Math.round(order.totalInPaise));
    const razorpayOrder = await razorpayClient().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `dr_${order._id.toString().slice(-12)}`,
      notes: {
        localOrderId: order._id.toString(),
        userId: user._id.toString(),
      },
    });

    order.status = "payment_pending";
    order.payment = {
      provider: "razorpay",
      razorpayOrderId: razorpayOrder.id,
      currency: "INR",
      amountInPaise,
      status: "created",
    };
    await order.save();

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

export async function PUT(request) {
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

    await connectDB();
    const order = await Order.findOne({ _id: localOrderId, user: user._id });
    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    await markOrderPaid(order, { razorpay_order_id, razorpay_payment_id, razorpay_signature });

    return Response.json({ order: presentOrder(order) });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}
