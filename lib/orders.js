import Order from "@/models/Order";
import Product from "@/models/Product";
import { sendReceiptEmail } from "@/lib/receipt";

export function presentOrder(order) {
  const plain = typeof order.toObject === "function" ? order.toObject() : order;
  const totalInPaise =
    plain.totalInPaise !== undefined && plain.totalInPaise !== null
      ? Math.round(plain.totalInPaise)
      : Math.round(Number(plain.total || 0) * 100);

  return {
    ...plain,
    _id: plain._id?.toString?.() || plain._id,
    user: plain.user?.toString?.() || plain.user,
    totalInPaise,
    total: totalInPaise / 100,
    items: (plain.items || []).map((item) => {
      // Ensure priceInPaise is always an integer
      const priceInPaise = Math.max(100, Math.round(Number(item.priceInPaise) || 0));
      
      return {
        ...item,
        product: item.product?.toString?.() || item.product,
        priceInPaise,
        price: priceInPaise / 100, // Always derive from paise
      };
    }),
  };
}

export async function adjustStockAfterPayment(order) {
  if (order.stockAdjusted) {
    return order;
  }

  const products = await Product.find({
    _id: { $in: order.items.map((item) => item.product) },
  }).select("stock title");
  const stockMap = new Map(products.map((product) => [product._id.toString(), product]));

  for (const item of order.items) {
    const product = stockMap.get(item.product.toString());
    if (!product || product.stock < item.quantity) {
      order.status = "payment_failed";
      order.payment = {
        ...order.payment,
        status: "stock_unavailable",
      };
      await order.save();
      throw new Error(`${item.title} is no longer available in the requested quantity`);
    }
  }

  await Product.bulkWrite(
    order.items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: -item.quantity } },
      },
    })),
  );

  order.stockAdjusted = true;
  return order;
}

export async function markOrderPaid(order, payment = {}) {
  order.status = "paid";
  order.payment = {
    ...order.payment,
    provider: "razorpay",
    razorpayOrderId: payment.razorpayOrderId || payment.razorpay_order_id || order.payment?.razorpayOrderId,
    razorpayPaymentId:
      payment.razorpayPaymentId || payment.razorpay_payment_id || order.payment?.razorpayPaymentId,
    razorpaySignature:
      payment.razorpaySignature || payment.razorpay_signature || order.payment?.razorpaySignature,
    currency: "INR",
    amountInPaise: order.totalInPaise,
    status: "captured",
  };

  await adjustStockAfterPayment(order);
  await order.save();

  // Send receipt email
  try {
    await sendReceiptEmail(order);
  } catch (error) {
    console.error("Failed to send receipt email:", error);
    // Don't throw error to prevent payment flow from breaking
  }

  return order;
}
