/**
 * Professional Email Templates
 * Modern, responsive HTML email templates compatible with Gmail, Outlook, and all major clients.
 * Uses inline styles, tables for layout, and MSO conditional comments for Outlook.
 */

/**
 * Escape HTML entities for safe email content
 */
function escapeHtml(value) {
  const s = String(value ?? "");
  return s
    .replace(/&/g, String.fromCharCode(38, 97, 109, 112, 59))
    .replace(/</g, String.fromCharCode(38, 108, 116, 59))
    .replace(/>/g, String.fromCharCode(38, 103, 116, 59))
    .replace(/"/g, String.fromCharCode(38, 113, 117, 111, 116, 59))
    .replace(/'/g, String.fromCharCode(38, 35, 51, 57, 59));
}

/**
 * Format price from paise to rupees string
 */
function formatPrice(priceInPaise) {
  const paise = Math.round(Number(priceInPaise) || 0);
  return (paise / 100).toFixed(2);
}

/**
 * Build the base email wrapper with header and footer
 */
function emailWrapper(content, options = {}) {
  const { title = "DR MART", year = new Date().getFullYear() } = options;

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    table { border-collapse: collapse; }
    td { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Preview text (hidden) -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(options.previewText || "")}
  </div>

  <!-- Full width wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 10px;">

        <!-- Email container (600px max) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto;">
          <tr>
            <td style="background: linear-gradient(135deg, #123f3a 0%, #1a5a52 100%); border-radius: 12px 12px 0 0; padding: 30px 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">🛍️ DR MART</h1>
              <p style="color: #a8d5d0; font-size: 14px; margin: 6px 0 0; font-weight: normal;">Your Premium Shopping Destination</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

              ${content}

            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; text-align: center; color: #888888; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 8px;">
                <strong style="color: #123f3a;">DR MART</strong> &bull; Your Trusted Online Store
              </p>
              <p style="margin: 0 0 4px;">
                If you have any questions, reply to this email or contact us at
                <a href="mailto:support@drmart.com" style="color: #123f3a; text-decoration: underline;">support@drmart.com</a>
              </p>
              <p style="margin: 0; color: #aaaaaa;">
                &copy; ${year} DR MART. All rights reserved.
              </p>
              <p style="margin: 12px 0 0; font-size: 11px; color: #bbbbbb;">
                This is an automated message from DR MART. Please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Generate a primary action button HTML
 */
function actionButton(url, text) {
  return `
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(url)}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="10%" strokecolor="#123f3a" fillcolor="#123f3a">
      <w:anchorlock/>
      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">${escapeHtml(text)}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <a href="${escapeHtml(url)}" style="display: inline-block; background-color: #123f3a; color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: bold; margin: 16px 0;">
      ${escapeHtml(text)}
    </a>
    <!--<![endif]-->
  `;
}

/**
 * Build a summary table row
 */
function summaryRow(label, value, options = {}) {
  const { bold = false, color = "", extra = "" } = options;
  return `
    <tr style="border-bottom: 1px solid #eeeeee;">
      <td style="padding: 8px 0; color: #666666; font-size: 13px;">${escapeHtml(label)}</td>
      <td style="padding: 8px 0; text-align: right; font-size: 13px; ${bold ? "font-weight: bold;" : ""} ${color ? `color: ${color};` : ""}">
        ${value}${extra}
      </td>
    </tr>
  `;
}

/**
 * Build a divider
 */
function divider() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-bottom: 1px solid #eeeeee; padding: 0; line-height: 1px; height: 1px;">&nbsp;</td></tr></table>`;
}

/**
 * ═══════════════════════════════════════════
 *  EMAIL TEMPLATES
 * ═══════════════════════════════════════════
 */

/**
 * Receipt / Payment Confirmation Email
 */
export function receiptEmail(order) {
  const items = order.items || [];
  const totalAmount = formatPrice(order.totalInPaise);
  const orderNumber = (order._id || order.id || "").toString().slice(-8).toUpperCase();
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let itemsHtml = "";
  for (const item of items) {
    const itemPrice = formatPrice(item.priceInPaise);
    const itemTotal = formatPrice(Math.round(Number(item.priceInPaise || 0)) * item.quantity);
    itemsHtml += `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${item.image ? `
              <td width="50" style="padding-right: 12px;">
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" width="50" height="50" style="border-radius: 8px; object-fit: contain; background: #f8f8f8;" />
              </td>
              ` : ""}
              <td style="font-size: 13px; color: #333333;">
                <strong style="display: block; font-size: 14px;">${escapeHtml(item.title)}</strong>
                <span style="color: #999999;">Qty: ${item.quantity} &times; ₹${itemPrice}</span>
              </td>
              <td width="80" style="text-align: right; font-size: 14px; font-weight: bold; color: #333333; vertical-align: middle;">
                ₹${itemTotal}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  const content = `
    <!-- Success header -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 60px; height: 60px; background-color: #d4edda; border-radius: 50%; line-height: 60px; font-size: 28px; margin-bottom: 12px;">✅</div>
      <h2 style="color: #155724; font-size: 22px; font-weight: 900; margin: 0 0 4px;">Payment Confirmed!</h2>
      <p style="color: #666666; font-size: 14px; margin: 0;">Your payment of <strong style="color: #333;">₹${totalAmount}</strong> was successful.</p>
    </div>

    ${divider()}

    <!-- Order Details -->
    <h3 style="color: #123f3a; font-size: 16px; font-weight: 800; margin: 20px 0 12px;">📋 Order Details</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
      <tr><td style="padding: 4px 0; color: #666;">Order ID</td><td style="padding: 4px 0; text-align: right; font-weight: bold; font-family: monospace;">#${orderNumber}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Order Date</td><td style="padding: 4px 0; text-align: right;">${escapeHtml(orderDate)}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Payment</td><td style="padding: 4px 0; text-align: right;"><span style="background: #d4edda; color: #155724; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">PAID</span></td></tr>
    </table>

    ${divider()}

    <!-- Shipping Address -->
    ${order.shippingAddress?.line1 ? `
    <h3 style="color: #123f3a; font-size: 16px; font-weight: 800; margin: 20px 0 12px;">📦 Shipping Address</h3>
    <p style="color: #333; font-size: 13px; margin: 0; line-height: 1.6;">
      ${escapeHtml(order.shippingAddress.name || "")}<br>
      ${escapeHtml(order.shippingAddress.line1 || "")}<br>
      ${escapeHtml(order.shippingAddress.city || "")}${order.shippingAddress.state ? `, ${escapeHtml(order.shippingAddress.state)}` : ""} &mdash; ${escapeHtml(order.shippingAddress.pincode || "")}<br>
      India<br>
      📱 ${escapeHtml(order.shippingAddress.phone || "N/A")}
    </p>
    ${divider()}
    ` : ""}

    <!-- Items -->
    <h3 style="color: #123f3a; font-size: 16px; font-weight: 800; margin: 20px 0 12px;">🛒 Items Ordered</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemsHtml || "<tr><td style='padding: 12px 0; color: #999; font-size: 13px;'>No items found</td></tr>"}
    </table>

    ${divider()}

    <!-- Payment Summary -->
    <h3 style="color: #123f3a; font-size: 16px; font-weight: 800; margin: 20px 0 12px;">💰 Payment Summary</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${summaryRow("Subtotal", `₹${totalAmount}`)}
      ${order.discountInPaise > 0 ? summaryRow("Discount", `-₹${formatPrice(order.discountInPaise)}`, { color: "#28a745" }) : ""}
      ${summaryRow("Shipping", order.shippingChargeInPaise > 0 ? `₹${formatPrice(order.shippingChargeInPaise)}` : "<span style='color:#28a745;'>FREE</span>")}
      ${summaryRow("Tax (GST)", `₹${formatPrice(order.taxInPaise)}`)}
      <tr>
        <td style="padding: 12px 0; border-top: 2px solid #123f3a; font-size: 16px; font-weight: 900; color: #123f3a;">Total Paid</td>
        <td style="padding: 12px 0; border-top: 2px solid #123f3a; text-align: right; font-size: 18px; font-weight: 900; color: #123f3a;">₹${totalAmount}</td>
      </tr>
      ${order.couponCode ? `<tr><td colspan="2" style="padding: 4px 0 0; color: #28a745; font-size: 12px;">🎟️ Coupon applied: ${escapeHtml(order.couponCode)}</td></tr>` : ""}
    </table>

    ${divider()}

    <!-- Payment Info -->
    <h3 style="color: #123f3a; font-size: 16px; font-weight: 800; margin: 20px 0 12px;">💳 Payment Information</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
      <tr><td style="padding: 4px 0; color: #666;">Method</td><td style="padding: 4px 0; text-align: right;">${order.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay (Card / UPI / Net Banking)"}</td></tr>
      ${order.payment?.razorpayPaymentId ? `<tr><td style="padding: 4px 0; color: #666;">Payment ID</td><td style="padding: 4px 0; text-align: right; font-family: monospace; font-size: 12px;">${escapeHtml(order.payment.razorpayPaymentId)}</td></tr>` : ""}
      <tr><td style="padding: 4px 0; color: #666;">Status</td><td style="padding: 4px 0; text-align: right;"><span style="background: #d4edda; color: #155724; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">Confirmed</span></td></tr>
    </table>

    ${order._id ? `
    <div style="text-align: center; margin-top: 24px;">
      ${actionButton(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/orders`, "View Your Orders")}
    </div>
    ` : ""}

    <p style="color: #999; font-size: 12px; margin: 20px 0 0; text-align: center; line-height: 1.6;">
      Thank you for shopping with DR MART!<br>
      Your order will be processed and shipped soon.
    </p>
  `;

  return emailWrapper(content, {
    title: `Receipt #${orderNumber}`,
    previewText: `Your DR MART payment of ₹${totalAmount} is confirmed. Order #${orderNumber}.`,
  });
}

/**
 * Order Confirmation Email
 */
export function orderConfirmationEmail(order) {
  const totalAmount = formatPrice(order.totalInPaise);
  const orderNumber = (order._id || order.id || "").toString().slice(-8).toUpperCase();

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 60px; height: 60px; background-color: #d4edda; border-radius: 50%; line-height: 60px; font-size: 28px; margin-bottom: 12px;">🎉</div>
      <h2 style="color: #155724; font-size: 22px; font-weight: 900; margin: 0 0 4px;">Order Confirmed!</h2>
      <p style="color: #666666; font-size: 14px; margin: 0;">Your order <strong style="color: #333;">#${orderNumber}</strong> has been placed successfully.</p>
    </div>

    <p style="color: #333; font-size: 13px; line-height: 1.6; margin: 0 0 16px;">
      Hey ${escapeHtml(order.customer?.name || "there")},<br><br>
      We've received your order and it's being processed. We'll send you updates as your order status changes.
    </p>

    ${divider()}

    <h3 style="color: #123f3a; font-size: 16px; font-weight: 800; margin: 20px 0 12px;">📋 Order Summary</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
      <tr><td style="padding: 4px 0; color: #666;">Order ID</td><td style="padding: 4px 0; text-align: right; font-weight: bold; font-family: monospace;">#${orderNumber}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Items</td><td style="padding: 4px 0; text-align: right;">${(order.items || []).length} item${(order.items || []).length !== 1 ? "s" : ""}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Total</td><td style="padding: 4px 0; text-align: right; font-size: 16px; font-weight: bold; color: #123f3a;">₹${totalAmount}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Payment</td><td style="padding: 4px 0; text-align: right;">${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</td></tr>
    </table>

    <div style="text-align: center; margin-top: 24px;">
      ${actionButton(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/orders`, "Track Your Order")}
    </div>
  `;

  return emailWrapper(content, {
    title: `Order #${orderNumber} Confirmed`,
    previewText: `Your DR MART order #${orderNumber} has been placed. Total: ₹${totalAmount}.`,
  });
}

/**
 * Shipping Update Email
 */
export function shippingUpdateEmail(order) {
  const orderNumber = (order._id || order.id || "").toString().slice(-8).toUpperCase();
  const status = order.fulfillmentStatus || order.status;
  const statusEmojis = {
    unfulfilled: "📦",
    packed: "📦",
    shipped: "🚚",
    delivered: "🎉",
    cancelled: "❌",
  };
  const statusLabels = {
    unfulfilled: "Processing",
    packed: "Packed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  const emoji = statusEmojis[status] || "📋";
  const label = statusLabels[status] || status;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 60px; height: 60px; background-color: #d4edda; border-radius: 50%; line-height: 60px; font-size: 28px; margin-bottom: 12px;">${emoji}</div>
      <h2 style="color: #123f3a; font-size: 22px; font-weight: 900; margin: 0 0 4px;">Order Status Update</h2>
      <p style="color: #666666; font-size: 14px; margin: 0;">Order <strong style="color: #333;">#${orderNumber}</strong> is now: <strong style="color: #123f3a;">${label}</strong></p>
    </div>

    <p style="color: #333; font-size: 13px; line-height: 1.6; margin: 0 0 16px;">
      Hey ${escapeHtml(order.customer?.name || "there")},<br><br>
      Your order status has been updated to <strong>${label}</strong>.
      ${status === "shipped" ? " Your package is on its way!" : ""}
      ${status === "delivered" ? " Your order has been delivered. Enjoy your purchase!" : ""}
    </p>

    ${order.shippingAddress?.line1 ? `
    ${divider()}
    <h3 style="color: #123f3a; font-size: 16px; font-weight: 800; margin: 20px 0 12px;">📍 Shipping To</h3>
    <p style="color: #333; font-size: 13px; margin: 0; line-height: 1.6;">
      ${escapeHtml(order.shippingAddress.name || "")}<br>
      ${escapeHtml(order.shippingAddress.line1 || "")}<br>
      ${escapeHtml(order.shippingAddress.city || "")} &mdash; ${escapeHtml(order.shippingAddress.pincode || "")}
    </p>
    ` : ""}

    <div style="text-align: center; margin-top: 24px;">
      ${actionButton(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/orders`, "View Order Details")}
    </div>
  `;

  return emailWrapper(content, {
    title: `Order #${orderNumber} ${label}`,
    previewText: `Your DR MART order #${orderNumber} is now ${label}.`,
  });
}

/**
 * Admin New Order Notification Email
 */
export function adminNewOrderNotification(order, adminEmail) {
  const totalAmount = formatPrice(order.totalInPaise);
  const orderNumber = (order._id || order.id || "").toString().slice(-8).toUpperCase();
  const customerName = order.customer?.name || "Unknown";
  const customerEmail = order.customer?.email || "Unknown";
  const itemCount = (order.items || []).length;

  let itemsHtml = "";
  for (const item of order.items || []) {
    itemsHtml += `<li style="padding: 4px 0; font-size: 13px; color: #555;">
      <strong>${escapeHtml(item.title)}</strong> &times; ${item.quantity} &mdash; ₹${formatPrice(item.priceInPaise * item.quantity)}
    </li>`;
  }

  const content = `
    <div style="margin-bottom: 24px;">
      <h2 style="color: #123f3a; font-size: 20px; font-weight: 900; margin: 0 0 4px;">🆕 New Order Received</h2>
      <p style="color: #666; font-size: 13px; margin: 0;">Order #${orderNumber} has been placed.</p>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 8px; font-size: 13px; margin-bottom: 16px;">
      <tr><td style="padding: 16px;">
        <p style="margin: 0 0 8px;"><strong>Customer:</strong> ${escapeHtml(customerName)}</p>
        <p style="margin: 0 0 8px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(customerEmail)}" style="color: #123f3a;">${escapeHtml(customerEmail)}</a></p>
        <p style="margin: 0 0 8px;"><strong>Items:</strong> ${itemCount}</p>
        <p style="margin: 0 0 8px;"><strong>Total:</strong> ₹${totalAmount}</p>
        <p style="margin: 0 0 8px;"><strong>Payment:</strong> ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Razorpay)"}</p>
        ${order.shippingAddress?.line1 ? `<p style="margin: 0;"><strong>Shipping:</strong> ${escapeHtml(order.shippingAddress.name)}, ${escapeHtml(order.shippingAddress.line1)}, ${escapeHtml(order.shippingAddress.city)}</p>` : ""}
      </td></tr>
    </table>

    <h3 style="color: #123f3a; font-size: 14px; font-weight: 800; margin: 0 0 8px;">Items Ordered</h3>
    <ul style="margin: 0; padding-left: 20px; list-style: none;">
      ${itemsHtml}
    </ul>

    <div style="text-align: center; margin-top: 24px;">
      ${actionButton(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/orders`, "View in Admin Panel")}
    </div>
  `;

  return emailWrapper(content, {
    title: `New Order #${orderNumber}`,
    previewText: `New order #${orderNumber} from ${customerName}. Amount: ₹${totalAmount}.`,
  });
}

/**
 * Generic notification email for contact form, etc.
 */
export function contactFormNotification(data) {
  const { name, email, subject, message } = data;

  const content = `
    <h2 style="color: #123f3a; font-size: 18px; font-weight: 900; margin: 0 0 16px;">📬 New Contact Form Submission</h2>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 8px; font-size: 13px; margin-bottom: 16px;">
      <tr><td style="padding: 16px;">
        <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(name || "N/A")}</p>
        <p style="margin: 0 0 8px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(email || "")}" style="color: #123f3a;">${escapeHtml(email || "N/A")}</a></p>
        <p style="margin: 0 0 8px;"><strong>Subject:</strong> ${escapeHtml(subject || "N/A")}</p>
      </td></tr>
    </table>

    <h3 style="color: #123f3a; font-size: 14px; font-weight: 800; margin: 0 0 8px;">Message</h3>
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; font-size: 13px; color: #856404; line-height: 1.6; border-radius: 4px;">
      ${escapeHtml(message || "No message content.")}
    </div>
  `;

  return emailWrapper(content, {
    title: "Contact Form Message",
    previewText: `New message from ${name || "someone"} - ${subject || "No subject"}`,
  });
}