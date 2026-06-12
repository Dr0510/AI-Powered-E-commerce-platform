import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  calculateTotals,
  validateCoupon,
  validateCheckoutPayload,
  incrementCouponUsage,
  formatOrderItems,
  checkStockAvailability,
} from "@/lib/checkout";
import { normalizePaise } from "@/lib/format";
import { getOrderById } from "@/lib/postgres";
import { presentOrder } from "@/lib/orders";

export async function POST(request) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const { items, address, paymentMethod, couponCode, notes } = await request.json();

    // Validate payload
    const validation = validateCheckoutPayload({ items, address, paymentMethod });
    if (!validation.valid) {
      return Response.json({ message: "Validation failed", errors: validation.errors }, { status: 400 });
    }

    const sql = db();

    // Fetch products from DB
    const productIds = items.map((item) => item.productId || item.product_id);
    const products = await sql`
      SELECT id, title, price_in_paise, category, image, images, stock, active
      FROM products
      WHERE id = ANY(${productIds})
    `;
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Check stock availability
    const stockCheck = checkStockAvailability(items, productMap);
    if (!stockCheck.available) {
      return Response.json({ message: stockCheck.message }, { status: 409 });
    }

    // Format order items
    const orderItems = formatOrderItems(items, productMap);
    if (!orderItems.length) {
      return Response.json({ message: "No valid products in cart" }, { status: 400 });
    }

    // Validate coupon if provided
    let coupon = null;
    let discountInPaise = 0;
    if (couponCode) {
      const subtotal = normalizePaise(
        orderItems.reduce((sum, item) => sum + item.priceInPaise * item.quantity, 0)
      );
      const couponResult = await validateCoupon(couponCode, subtotal, user._id);
      if (!couponResult.valid) {
        return Response.json({ message: couponResult.message }, { status: 400 });
      }
      coupon = couponResult.coupon;
      discountInPaise = couponResult.discountAmount;
    }

    // Calculate totals
    const totals = calculateTotals(orderItems, coupon);

    // Begin transaction
    const [order] = await sql`
      INSERT INTO orders (
        user_id, clerk_id, customer_name, customer_email,
        total_in_paise, currency, status,
        shipping_name, shipping_line1, shipping_city, shipping_state,
        shipping_country, shipping_phone, shipping_pincode,
        discount_in_paise, coupon_code, shipping_charge_in_paise, tax_in_paise,
        payment_method, notes
      )
      VALUES (
        ${user._id},
        ${user.clerkId},
        ${address.name || user.name},
        ${user.email},
        ${totals.finalTotal},
        'INR',
        ${paymentMethod === "cod" ? "pending" : "payment_pending"},
        ${address.name || ""},
        ${address.line1 || ""},
        ${address.city || ""},
        ${address.state || ""},
        ${address.country || "India"},
        ${address.phone || ""},
        ${address.pincode || ""},
        ${discountInPaise},
        ${coupon ? coupon.code : null},
        ${totals.shipping},
        ${totals.tax},
        ${paymentMethod},
        ${notes || null}
      )
      RETURNING id
    `;

    // Insert order items
    for (const item of orderItems) {
      await sql`
        INSERT INTO order_items (order_id, product_id, title, image, price_in_paise, quantity)
        VALUES (${order.id}, ${item.productId}, ${item.title}, ${item.image}, ${item.priceInPaise}, ${item.quantity})
      `;
    }

    // Increment coupon usage if applied
    if (coupon) {
      await incrementCouponUsage(coupon.id, sql);
    }

    // Handle COD orders — adjust stock immediately
    if (paymentMethod === "cod") {
      for (const item of orderItems) {
        await sql`
          UPDATE products SET stock = stock - ${item.quantity}, updated_at = now()
          WHERE id = ${item.productId} AND stock >= ${item.quantity}
        `;
      }
      await sql`UPDATE orders SET stock_adjusted = true, updated_at = now() WHERE id = ${order.id}`;
    }

    // Create payment record only for COD (Razorpay payment is created by /api/payments/razorpay)
    if (paymentMethod === "cod") {
      await sql`
        INSERT INTO payments (order_id, provider, currency, amount_in_paise, status)
        VALUES (${order.id}, 'cod', 'INR', ${totals.finalTotal}, 'cod')
      `;
    }

    const createdOrder = await getOrderById(order.id, user._id);

    return Response.json(
      {
        order: presentOrder(createdOrder),
        totals,
        redirectTo: paymentMethod === "cod" ? `/orders/success/${order.id}` : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json({ message: "Unable to place order", error: error.message }, { status: 500 });
  }
}