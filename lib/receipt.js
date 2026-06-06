import { Resend } from 'resend';

function formatPrice(priceInPaise) {
  const paise = Math.round(Number(priceInPaise) || 0);
  return (paise / 100).toFixed(2);
}

function receiptFromEmail() {
  return process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM || process.env.EMAIL_FROM || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function generateReceiptHTML(order) {
  const items = order.items || [];
  const itemsHTML = items
    .map(
      (item) => {
        const itemPriceInPaise = item.priceInPaise ?? item.price * 100;
        const itemPrice = formatPrice(itemPriceInPaise);
        const itemTotal = formatPrice(Math.round(Number(itemPriceInPaise || 0)) * item.quantity);
        return `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">${escapeHtml(item.title)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${itemPrice}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${itemTotal}</td>
    </tr>
  `;
      }
    )
    .join('');

  const totalAmount = formatPrice(order.totalInPaise);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Receipt</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px;">
      <h1 style="color: #007bff; margin: 0;">Order Receipt</h1>
      <p style="margin: 10px 0; color: #666;">Thank you for your purchase!</p>
    </div>

    <!-- Order Info -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #333; font-size: 16px; margin-top: 0;">Order Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; color: #666;">Order ID:</td>
          <td style="padding: 8px; font-weight: bold;">${order._id.toString().slice(-8).toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #666;">Order Date:</td>
          <td style="padding: 8px;">${new Date(order.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #666;">Payment Status:</td>
          <td style="padding: 8px;"><span style="background-color: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px;">Paid</span></td>
        </tr>
      </table>
    </div>

    <!-- Customer Info -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #333; font-size: 16px; margin-top: 0;">Shipping Address</h2>
      <p style="margin: 5px 0;">
        ${escapeHtml(order.customer?.name || 'N/A')}<br>
        ${escapeHtml(order.shippingAddress?.line1 || '')}<br>
        ${escapeHtml(order.shippingAddress?.city || '')}, ${escapeHtml(order.shippingAddress?.pincode || '')}<br>
        ${escapeHtml(order.shippingAddress?.country || 'India')}<br>
        📱 ${escapeHtml(order.shippingAddress?.phone || 'N/A')}
      </p>
    </div>

    <!-- Items -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #333; font-size: 16px; margin-top: 0;">Items Ordered</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px; text-align: left; color: #666;">Item</th>
            <th style="padding: 12px; text-align: center; color: #666;">Qty</th>
            <th style="padding: 12px; text-align: right; color: #666;">Price</th>
            <th style="padding: 12px; text-align: right; color: #666;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    </div>

    <!-- Payment Summary -->
    <div style="margin-bottom: 30px; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 0; color: #666;">Subtotal:</td>
          <td style="padding: 10px 0; text-align: right;">₹${totalAmount}</td>
        </tr>
        <tr style="font-weight: bold; font-size: 18px;">
          <td style="padding: 15px 0;">Total Amount:</td>
          <td style="padding: 15px 0; text-align: right; color: #007bff;">₹${totalAmount}</td>
        </tr>
      </table>
    </div>

    <!-- Payment Info -->
    <div style="margin-bottom: 30px; background-color: #e7f3ff; padding: 15px; border-left: 4px solid #007bff; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #007bff;">Payment Confirmed</h3>
      <p style="margin: 5px 0; color: #333;">
        <strong>Payment ID:</strong> ${order.payment?.razorpayPaymentId || 'N/A'}<br>
        <strong>Payment Method:</strong> Razorpay<br>
        <strong>Amount:</strong> ₹${totalAmount}
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #666; font-size: 12px;">
      <p>
        If you have any questions about your order, please contact us at support@example.com<br>
        <strong>Thank you for shopping with us!</strong>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendReceiptEmail(order) {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }

    const fromEmail = receiptFromEmail();
    if (!fromEmail) {
      throw new Error('RESEND_FROM_EMAIL is not set');
    }

    const customerEmail = order.customer?.email;
    if (!customerEmail) {
      throw new Error('Customer email not found');
    }

    const testingEmail = process.env.RESEND_TEST_EMAIL;
    const isOnboardingSender = fromEmail.toLowerCase() === 'onboarding@resend.dev' || fromEmail.toLowerCase().endsWith('@resend.dev');
    
    if (isOnboardingSender && !testingEmail) {
      console.warn('RESEND_FROM_EMAIL is using onboarding sender without RESEND_TEST_EMAIL. Email may fail.');
    }
    
    if (isOnboardingSender && testingEmail && customerEmail.toLowerCase() !== testingEmail.toLowerCase()) {
      console.warn(
        `Resend onboarding sender can only send to ${testingEmail}. Skipping receipt email to ${customerEmail}.`,
      );
      return { skipped: true, reason: 'Onboarding sender restriction' };
    }

    const receiptHTML = generateReceiptHTML(order);
    const resend = new Resend(process.env.RESEND_API_KEY);
    const orderNumber = order._id.toString().slice(-8).toUpperCase();

    const response = await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject: `DR MART Receipt - Order #${orderNumber}`,
      html: receiptHTML,
      text: `Thank you for your purchase. Your DR MART order #${orderNumber} payment is confirmed. Total: ₹${formatPrice(order.totalInPaise)}.`,
    });

    if (response?.error) {
      throw new Error(response.error.message || 'Resend failed to send receipt email');
    }

    const emailId = response?.id || response?.data?.id;
    if (!emailId) {
      throw new Error(`Resend did not return an email id: ${JSON.stringify(response)}`);
    }

    return response;
  } catch (error) {
    console.error('Error sending receipt email:', error);
    throw error;
  }
}
