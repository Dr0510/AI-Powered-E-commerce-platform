import { db } from "@/lib/db";
import { normalizePaise, paiseToRupees, moneyFromPaise } from "@/lib/format";

const SHIPPING_THRESHOLD = 49900; // paise (₹499)
const SHIPPING_CHARGE = 4000; // paise (₹40)
const GST_RATE = 0.12; // 12%

/**
 * Calculate complete order totals breakdown
 */
export function calculateTotals(items, coupon = null) {
  const subtotal = normalizePaise(
    items.reduce((sum, item) => sum + normalizePaise(item.priceInPaise) * Math.max(1, Number(item.quantity || 1)), 0)
  );

  let discountAmount = 0;
  let freeShipping = false;

  if (coupon) {
    discountAmount = couponDiscount(subtotal, coupon);
    if (coupon.discount_type === "free_shipping") {
      freeShipping = true;
    }
  }

  const shipping = freeShipping ? 0 : shippingCharges(subtotal);
  const tax = calculateGST(subtotal - discountAmount);
  const finalTotal = normalizePaise(subtotal - discountAmount + shipping + tax);

  return {
    subtotal,
    subtotalFormatted: moneyFromPaise(subtotal),
    discountAmount,
    discountAmountFormatted: moneyFromPaise(discountAmount),
    shipping,
    shippingFormatted: moneyFromPaise(shipping),
    shippingFree: freeShipping || subtotal >= SHIPPING_THRESHOLD,
    tax,
    taxFormatted: moneyFromPaise(tax),
    taxRate: GST_RATE,
    finalTotal,
    finalTotalFormatted: moneyFromPaise(finalTotal),
    itemCount: items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0),
  };
}

/**
 * Calculate coupon discount amount
 */
export function couponDiscount(subtotal, coupon) {
  if (!coupon || !coupon.active) return 0;

  if (coupon.discount_type === "free_shipping") return 0;

  if (coupon.discount_type === "percent") {
    const percent = Math.max(0, Math.min(100, Number(coupon.discount_value || 0)));
    return Math.round((subtotal * percent) / 100);
  }

  if (coupon.discount_type === "fixed") {
    return Math.min(Number(coupon.discount_value || 0) * 100, subtotal);
  }

  return 0;
}

/**
 * Check if shipping is free or calculate charges
 */
export function shippingCharges(subtotal) {
  if (subtotal >= SHIPPING_THRESHOLD) return 0;
  return SHIPPING_CHARGE;
}

/**
 * Calculate GST tax
 */
export function calculateGST(amount) {
  return Math.round(Math.max(0, amount) * GST_RATE);
}

/**
 * Validate coupon code against database
 */
export async function validateCoupon(code, subtotal, userId = null) {
  if (!code || typeof code !== "string") {
    return { valid: false, message: "Please enter a coupon code" };
  }

  const sql = db();
  const cleanedCode = code.trim().toUpperCase();

  const [coupon] = await sql`
    SELECT * FROM coupons
    WHERE code = ${cleanedCode}
    LIMIT 1
  `;

  if (!coupon) {
    return { valid: false, message: "Invalid coupon code" };
  }

  if (!coupon.active) {
    return { valid: false, message: "This coupon is no longer active" };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, message: "This coupon has expired" };
  }

  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return { valid: false, message: "This coupon has reached its usage limit" };
  }

  if (subtotal < coupon.min_order_in_paise) {
    return {
      valid: false,
      message: `Minimum order value of ${moneyFromPaise(coupon.min_order_in_paise)} required`,
    };
  }

  if (userId && coupon.max_uses_per_user) {
    const [usage] = await sql`
      SELECT COUNT(*)::int AS count
      FROM orders
      WHERE user_id = ${userId}
        AND coupon_code = ${cleanedCode}
        AND status IN ('paid', 'payment_pending', 'pending')
    `;
    if (usage && usage.count >= coupon.max_uses_per_user) {
      return { valid: false, message: "You have already used this coupon" };
    }
  }

  const discountAmount = couponDiscount(subtotal, coupon);

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      min_order_in_paise: coupon.min_order_in_paise,
    },
    discountAmount,
    discountFormatted: moneyFromPaise(discountAmount),
    message: coupon.description || "Coupon applied successfully",
  };
}

/**
 * Validate shipping address fields
 */
export function validateAddress(address, isRequired = true) {
  const errors = {};

  if (!address || typeof address !== "object") {
    return { valid: false, errors: { _form: "Address is required" } };
  }

  if (isRequired && !address.name?.trim()) {
    errors.name = "Full name is required";
  }

  if (isRequired && !address.phone?.trim()) {
    errors.phone = "Phone number is required";
  } else if (address.phone && !/^[0-9]{10}$/.test(address.phone.replace(/\D/g, ""))) {
    errors.phone = "Enter a valid 10-digit phone number";
  }

  if (isRequired && !address.line1?.trim()) {
    errors.line1 = "Address line is required";
  }

  if (isRequired && !address.city?.trim()) {
    errors.city = "City is required";
  }

  if (isRequired && !address.pincode?.trim()) {
    errors.pincode = "Pincode is required";
  } else if (address.pincode && !/^[0-9]{6}$/.test(address.pincode.replace(/\D/g, ""))) {
    errors.pincode = "Enter a valid 6-digit pincode";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate full checkout payload before submission
 */
export function validateCheckoutPayload({ items, address, paymentMethod }) {
  const errors = {};
  const validMethods = new Set(["cod", "razorpay"]);

  if (!items?.length) {
    errors.items = "Cart is empty";
  }

  const addressValidation = validateAddress(address);
  if (!addressValidation.valid) {
    Object.assign(errors, addressValidation.errors);
  }

  if (!paymentMethod || !validMethods.has(paymentMethod)) {
    errors.paymentMethod = "Select a valid payment method";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Get coupon usage by user for tracking
 */
export async function incrementCouponUsage(couponId, sql) {
  await sql`
    UPDATE coupons
    SET used_count = used_count + 1,
        updated_at = now()
    WHERE id = ${couponId}
  `;
}

/**
 * Format product items for order creation from cart
 */
export function formatOrderItems(items, productsMap) {
  return items
    .map((item) => {
      const product = productsMap.get(item.productId || item.product_id);
      if (!product || product.active === false) return null;

      const quantity = Math.max(1, Math.floor(Number(item.quantity || 1)));
      const productPrice = normalizePaise(
        item.priceInPaise || item.price_in_paise || product.price_in_paise || 0
      );

      return {
        product: product.id,
        productId: product.id,
        title: product.title,
        image: product.images?.[0]?.url || product.image || "",
        priceInPaise: productPrice,
        quantity,
      };
    })
    .filter(Boolean);
}

/**
 * Check product stock availability
 */
export function checkStockAvailability(items, productsMap) {
  for (const item of items) {
    const product = productsMap.get(item.productId || item.product_id);
    if (!product) {
      return { available: false, message: `${item.title || "Product"} not found` };
    }
    if (product.stock < item.quantity) {
      return {
        available: false,
        message: `${product.title} has only ${product.stock} left`,
      };
    }
  }
  return { available: true };
}