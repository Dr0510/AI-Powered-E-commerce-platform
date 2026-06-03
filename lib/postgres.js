import { db } from "@/lib/db";
import { paiseToRupees } from "@/lib/format";

export function productFromRow(row = {}) {
  if (!row) return null;
  const priceInPaise = Number(row.price_in_paise || row.priceInPaise || 0);

  return {
    _id: row.id,
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description || "",
    priceInPaise,
    price: paiseToRupees(priceInPaise),
    category: row.category || "General",
    image: row.image || row.images?.[0]?.url || "",
    images: row.images || [],
    stock: Number(row.stock || 0),
    active: row.active !== false,
    tags: row.tags || [],
    embedding: row.embedding || [],
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

export function userFromRow(row = {}) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    clerkId: row.clerk_id || row.clerkId,
    name: row.name,
    email: row.email,
    role: row.role || "customer",
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

export function reviewFromRow(row = {}) {
  return {
    _id: row.id,
    id: row.id,
    product: row.product_id,
    user: row.user_id,
    userName: row.user_name,
    rating: Number(row.rating),
    comment: row.comment || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function orderFromRow(row = {}) {
  if (!row) return null;
  const payment = row.payment || {};
  return {
    _id: row.id,
    id: row.id,
    user: row.user_id,
    clerkId: row.clerk_id,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
    },
    items: (row.items || []).map((item) => {
      const priceInPaise = Number(item.price_in_paise || 0);
      return {
        product: item.product_id,
        title: item.title,
        image: item.image,
        priceInPaise,
        price: paiseToRupees(priceInPaise),
        quantity: Number(item.quantity || 1),
      };
    }),
    totalInPaise: Number(row.total_in_paise || 0),
    total: paiseToRupees(row.total_in_paise),
    currency: row.currency || "INR",
    status: row.status,
    fulfillmentStatus: row.fulfillment_status,
    stockAdjusted: row.stock_adjusted,
    payment: {
      provider: payment.provider || "razorpay",
      razorpayOrderId: payment.razorpay_order_id,
      razorpayPaymentId: payment.razorpay_payment_id,
      razorpaySignature: payment.razorpay_signature,
      currency: payment.currency || "INR",
      amountInPaise: payment.amount_in_paise,
      status: payment.status,
    },
    shippingAddress: {
      name: row.shipping_name,
      line1: row.shipping_line1,
      city: row.shipping_city,
      country: row.shipping_country,
      phone: row.shipping_phone,
      pincode: row.shipping_pincode,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getOrderById(id, userId = null) {
  const sql = db();
  const rows = userId
    ? await sql`
        SELECT o.*, p.provider, p.razorpay_order_id, p.razorpay_payment_id, p.razorpay_signature,
          p.currency AS payment_currency, p.amount_in_paise, p.status AS payment_status
        FROM orders o
        LEFT JOIN payments p ON p.order_id = o.id
        WHERE o.id = ${id} AND o.user_id = ${userId}
        LIMIT 1
      `
    : await sql`
        SELECT o.*, p.provider, p.razorpay_order_id, p.razorpay_payment_id, p.razorpay_signature,
          p.currency AS payment_currency, p.amount_in_paise, p.status AS payment_status
        FROM orders o
        LEFT JOIN payments p ON p.order_id = o.id
        WHERE o.id = ${id}
        LIMIT 1
      `;

  if (!rows.length) return null;
  return hydrateOrder(rows[0]);
}

export async function getOrderByRazorpayOrderId(razorpayOrderId) {
  const sql = db();
  const rows = await sql`
    SELECT o.*, p.provider, p.razorpay_order_id, p.razorpay_payment_id, p.razorpay_signature,
      p.currency AS payment_currency, p.amount_in_paise, p.status AS payment_status
    FROM orders o
    JOIN payments p ON p.order_id = o.id
    WHERE p.razorpay_order_id = ${razorpayOrderId}
    LIMIT 1
  `;

  if (!rows.length) return null;
  return hydrateOrder(rows[0]);
}

export async function listOrders({ userId = null, limit = 25 } = {}) {
  const sql = db();
  const rows = userId
    ? await sql`
        SELECT o.*, p.provider, p.razorpay_order_id, p.razorpay_payment_id, p.razorpay_signature,
          p.currency AS payment_currency, p.amount_in_paise, p.status AS payment_status
        FROM orders o
        LEFT JOIN payments p ON p.order_id = o.id
        WHERE o.user_id = ${userId}
        ORDER BY o.created_at DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT o.*, p.provider, p.razorpay_order_id, p.razorpay_payment_id, p.razorpay_signature,
          p.currency AS payment_currency, p.amount_in_paise, p.status AS payment_status
        FROM orders o
        LEFT JOIN payments p ON p.order_id = o.id
        ORDER BY o.created_at DESC
        LIMIT ${limit}
      `;

  return Promise.all(rows.map(hydrateOrder));
}

async function hydrateOrder(row) {
  const sql = db();
  const items = await sql`
    SELECT product_id, title, image, price_in_paise, quantity
    FROM order_items
    WHERE order_id = ${row.id}
    ORDER BY created_at ASC
  `;

  return orderFromRow({
    ...row,
    payment: {
      provider: row.provider,
      razorpay_order_id: row.razorpay_order_id,
      razorpay_payment_id: row.razorpay_payment_id,
      razorpay_signature: row.razorpay_signature,
      currency: row.payment_currency,
      amount_in_paise: row.amount_in_paise,
      status: row.payment_status,
    },
    items,
  });
}
