import { sendReceiptEmail } from "@/lib/receipt";
import { normalizePaise, rupeesToPaise } from "@/lib/format";
import { db } from "@/lib/db";
import { getOrderById } from "@/lib/postgres";

export function presentOrder(order) {
  const plain = typeof order.toObject === "function" ? order.toObject() : order;
  const totalInPaise =
    plain.totalInPaise !== undefined && plain.totalInPaise !== null
      ? normalizePaise(plain.totalInPaise)
      : rupeesToPaise(plain.total);

  return {
    ...plain,
    _id: plain._id?.toString?.() || plain._id,
    user: plain.user?.toString?.() || plain.user,
    totalInPaise,
    total: totalInPaise / 100,
    items: (plain.items || []).map((item) => {
      const priceInPaise =
        item.priceInPaise !== undefined && item.priceInPaise !== null
          ? normalizePaise(item.priceInPaise)
          : rupeesToPaise(item.price);
      
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

  const sql = db();
  const ids = order.items.map((item) => item.product);
  const products = await sql`
    SELECT id, stock, title
    FROM products
    WHERE id = ANY(${ids})
  `;
  const stockMap = new Map(products.map((product) => [product.id, product]));

  for (const item of order.items) {
    const product = stockMap.get(item.product);
    if (!product || product.stock < item.quantity) {
      await sql`UPDATE orders SET status = 'payment_failed', updated_at = now() WHERE id = ${order._id}`;
      await sql`UPDATE payments SET status = 'stock_unavailable', updated_at = now() WHERE order_id = ${order._id}`;
      throw new Error(`${item.title} is no longer available in the requested quantity`);
    }
  }

  for (const item of order.items) {
    await sql`
      UPDATE products
      SET stock = stock - ${item.quantity}, updated_at = now()
      WHERE id = ${item.product}
    `;
    await sql`
      UPDATE inventory
      SET quantity_on_hand = GREATEST(quantity_on_hand - ${item.quantity}, 0), updated_at = now()
      WHERE product_id = ${item.product}
    `;
  }

  order.stockAdjusted = true;
  await sql`UPDATE orders SET stock_adjusted = true, updated_at = now() WHERE id = ${order._id}`;
  return order;
}

export async function markOrderPaid(order, payment = {}) {
  const sql = db();
  await sql`UPDATE orders SET status = 'paid', updated_at = now() WHERE id = ${order._id}`;
  await sql`
    INSERT INTO payments (
      order_id, provider, razorpay_order_id, razorpay_payment_id, razorpay_signature, currency, amount_in_paise, status
    )
    VALUES (
      ${order._id},
      'razorpay',
      ${payment.razorpayOrderId || payment.razorpay_order_id || order.payment?.razorpayOrderId},
      ${payment.razorpayPaymentId || payment.razorpay_payment_id || order.payment?.razorpayPaymentId},
      ${payment.razorpaySignature || payment.razorpay_signature || order.payment?.razorpaySignature},
      'INR',
      ${order.totalInPaise},
      'captured'
    )
    ON CONFLICT (order_id)
    DO UPDATE SET
      razorpay_order_id = COALESCE(EXCLUDED.razorpay_order_id, payments.razorpay_order_id),
      razorpay_payment_id = COALESCE(EXCLUDED.razorpay_payment_id, payments.razorpay_payment_id),
      razorpay_signature = COALESCE(EXCLUDED.razorpay_signature, payments.razorpay_signature),
      amount_in_paise = EXCLUDED.amount_in_paise,
      status = 'captured',
      updated_at = now()
  `;

  await adjustStockAfterPayment(order);
  const paidOrder = await getOrderById(order._id);

  // Send receipt email
  try {
    await sendReceiptEmail(paidOrder);
  } catch (error) {
    console.error("Failed to send receipt email:", error);
    // Don't throw error to prevent payment flow from breaking
  }

  return paidOrder;
}
