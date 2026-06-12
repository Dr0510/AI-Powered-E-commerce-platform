import { sendReceiptEmail } from "@/lib/receipt";
import { normalizePaise, rupeesToPaise } from "@/lib/format";
import { db } from "@/lib/db";
import { getOrderById } from "@/lib/postgres";
import { invalidateProductCache } from "@/lib/cache";

function toStringId(value) {
  if (value === undefined || value === null) return value;
  return typeof value.toString === "function" ? value.toString() : value;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function totalInPaiseFrom(order) {
  const paise = firstDefined(order.totalInPaise, order.total_in_paise);
  if (paise !== undefined && paise !== null) return normalizePaise(paise);
  return rupeesToPaise(order.total);
}

function priceInPaiseFrom(item) {
  const paise = firstDefined(item.priceInPaise, item.price_in_paise);
  if (paise !== undefined && paise !== null) return normalizePaise(paise);
  return rupeesToPaise(item.price);
}

export function presentOrder(order) {
  const plain = typeof order.toObject === "function" ? order.toObject() : order;
  const id = toStringId(plain._id) || toStringId(plain.id);
  const totalInPaise = totalInPaiseFrom(plain);

  return {
    ...plain,
    _id: id,
    id: plain.id || id,
    user: toStringId(plain.user) || toStringId(plain.user_id),
    fulfillmentStatus: firstDefined(plain.fulfillmentStatus, plain.fulfillment_status),
    shippingAddress: plain.shippingAddress || {
      name: plain.shipping_name,
      line1: plain.shipping_line1,
      city: plain.shipping_city,
      country: plain.shipping_country,
      phone: plain.shipping_phone,
      pincode: plain.shipping_pincode,
    },
    customer: plain.customer || {
      name: plain.customer_name,
      email: plain.customer_email,
    },
    totalInPaise,
    total: totalInPaise / 100,
    items: (plain.items || []).map((item) => {
      const priceInPaise = priceInPaiseFrom(item);

      return {
        ...item,
        _id: toStringId(item._id) || toStringId(item.id),
        id: item.id || toStringId(item._id),
        product: toStringId(item.product) || toStringId(item.product_id) || toStringId(item.productId),
        productId: toStringId(item.productId) || toStringId(item.product_id) || toStringId(item.product),
        priceInPaise,
        price: priceInPaise / 100,
      };
    }),
  };
}

export async function adjustStockAfterPayment(order) {
  if (order.stockAdjusted) {
    return order;
  }

  const sql = db();
  const requestedItems = order.items.map((item) => ({
    product_id: item.product,
    title: item.title,
    quantity: Number(item.quantity || 1),
  }));

  const [stockResult] = await sql`
    WITH requested AS (
      SELECT product_id, title, quantity
      FROM jsonb_to_recordset(${JSON.stringify(requestedItems)}::jsonb)
        AS item(product_id uuid, title text, quantity integer)
    ),
    insufficient AS (
      SELECT requested.title, COALESCE(products.stock, 0) AS stock
      FROM requested
      LEFT JOIN products ON products.id = requested.product_id
      WHERE products.id IS NULL OR products.stock < requested.quantity
    ),
    updated AS (
      UPDATE products
      SET stock = products.stock - requested.quantity,
        updated_at = now()
      FROM requested
      WHERE products.id = requested.product_id
        AND NOT EXISTS (SELECT 1 FROM insufficient)
      RETURNING products.id
    ),
    inventory_updated AS (
      UPDATE inventory
      SET quantity_on_hand = GREATEST(inventory.quantity_on_hand - requested.quantity, 0),
        updated_at = now()
      FROM requested
      WHERE inventory.product_id = requested.product_id
        AND NOT EXISTS (SELECT 1 FROM insufficient)
      RETURNING inventory.id
    )
    SELECT
      (SELECT COUNT(*)::int FROM requested) AS requested_count,
      (SELECT COUNT(*)::int FROM updated) AS updated_count,
      (SELECT COUNT(*)::int FROM insufficient) AS insufficient_count,
      (SELECT jsonb_agg(jsonb_build_object('title', title, 'stock', stock)) FROM insufficient) AS insufficient_items
  `;

  if (
    Number(stockResult.insufficient_count || 0) > 0 ||
    Number(stockResult.updated_count || 0) !== Number(stockResult.requested_count || 0)
  ) {
    const first = stockResult.insufficient_items?.[0];
    await sql`UPDATE orders SET status = 'payment_failed', updated_at = now() WHERE id = ${order._id}`;
    await sql`UPDATE payments SET status = 'stock_unavailable', updated_at = now() WHERE order_id = ${order._id}`;
    throw new Error(`${first?.title || "Product"} has only ${first?.stock || 0} left`);
  }

  order.stockAdjusted = true;
  await sql`UPDATE orders SET stock_adjusted = true, updated_at = now() WHERE id = ${order._id}`;
  invalidateProductCache();
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
      receipt_email_status = CASE
        WHEN payments.receipt_email_sent_at IS NULL THEN 'pending'
        ELSE payments.receipt_email_status
      END,
      updated_at = now()
  `;

  await adjustStockAfterPayment(order);
  const paidOrder = await getOrderById(order._id);

  const [paymentRow] = await sql`
    SELECT receipt_email_sent_at
    FROM payments
    WHERE order_id = ${order._id}
    LIMIT 1
  `;

  if (!paymentRow?.receipt_email_sent_at) {
    try {
      const receiptResponse = await sendReceiptEmail(paidOrder);
      await sql`
        UPDATE payments
        SET receipt_email_sent_at = now(),
          receipt_email_status = 'sent',
          receipt_email_error = null,
          updated_at = now()
        WHERE order_id = ${order._id}
      `;
      paidOrder.payment = {
        ...(paidOrder.payment || {}),
        receiptEmailSentAt: new Date().toISOString(),
        receiptEmailStatus: "sent",
        receiptEmailId: receiptResponse?.data?.id,
      };
    } catch (error) {
      console.error("Failed to send receipt email:", error);
      await sql`
        UPDATE payments
        SET receipt_email_status = 'failed',
          receipt_email_error = ${String(error.message || error).slice(0, 500)},
          updated_at = now()
        WHERE order_id = ${order._id}
      `;
      paidOrder.payment = {
        ...(paidOrder.payment || {}),
        receiptEmailStatus: "failed",
        receiptEmailError: error.message,
      };
    }
  }

  return paidOrder;
}
