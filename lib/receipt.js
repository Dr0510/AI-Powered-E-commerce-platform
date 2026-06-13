/**
 * Receipt Email Module
 * Wraps the centralized email service for sending receipt-related emails.
 * Uses the professional templates from email-templates.js and the
 * reliable email service from email.js.
 */
import { sendEmail } from "@/lib/email";
import { receiptEmail } from "@/lib/email-templates";
import { db } from "@/lib/db";

/**
 * Format price from paise to rupees string
 */
function formatPrice(priceInPaise) {
  const paise = Math.round(Number(priceInPaise) || 0);
  return (paise / 100).toFixed(2);
}

/**
 * Generate receipt HTML for direct download/view (kept for backward compat)
 */
export function generateReceiptHTML(order) {
  const items = order.items || [];
  const totalAmount = formatPrice(order.totalInPaise);
  const orderNumber = (order._id || order.id || "").toString().slice(-8).toUpperCase();

  // A simpler version for download — uses professional template when emailing
  const itemsHtml = items
    .map((item) => {
      const itemPrice = formatPrice(item.priceInPaise);
      const itemTotal = formatPrice(Math.round(Number(item.priceInPaise || 0)) * item.quantity);
      return `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.title)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${itemPrice}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${itemTotal}</td>
    </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt #${orderNumber}</title></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; border-bottom: 2px solid #123f3a; padding-bottom: 20px; margin-bottom: 30px;">
    <h1 style="color: #123f3a;">DR MART Receipt</h1>
    <p style="color: #666;">Thank you for your purchase!</p>
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
    <tr><td style="padding: 8px; color: #666;">Order ID:</td><td style="padding: 8px; font-weight: bold;">#${orderNumber}</td></tr>
    <tr><td style="padding: 8px; color: #666;">Date:</td><td style="padding: 8px;">${new Date(order.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</td></tr>
    <tr><td style="padding: 8px; color: #666;">Status:</td><td style="padding: 8px;"><span style="background: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px;">Paid</span></td></tr>
  </table>
  <table style="width: 100%; border-collapse: collapse;">
    <thead><tr style="background: #f8f9fa;"><th style="padding: 12px; text-align: left;">Item</th><th style="padding: 12px; text-align: center;">Qty</th><th style="padding: 12px; text-align: right;">Price</th><th style="padding: 12px; text-align: right;">Total</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <div style="margin-top: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: right; font-size: 18px; font-weight: bold; color: #123f3a;">
    Total: ₹${totalAmount}
  </div>
</body></html>`;
}

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
 * Send a receipt email using the centralized email service.
 * Includes:
 * - Email validation
 * - Professional template
 * - Retry with exponential backoff (via email.js)
 * - Deduplication (via email.js)
 * - Detailed logging
 *
 * @param {Object} order - The order object with customer info
 * @returns {Promise<Object>} Result from sendEmail
 */
export async function sendReceiptEmail(order) {
  const customerEmail = order.customer?.email || order.customer_email;

  if (!customerEmail) {
    console.error("[Receipt] Customer email not found for order:", order._id?.toString().slice(-8));
    return { success: false, error: "Customer email not found" };
  }

  const html = receiptEmail(order);
  const orderNumber = (order._id || order.id || "").toString().slice(-8).toUpperCase();

  console.log("[Receipt] Sending receipt email", {
    orderId: order._id?.toString().slice(-8),
    customerEmail,
  });

  const result = await sendEmail({
    to: customerEmail,
    subject: `DR MART Receipt - Order #${orderNumber}`,
    html,
    text: `Thank you for your purchase! Your DR MART order #${orderNumber} has been confirmed. Total: ₹${formatPrice(order.totalInPaise)}.`,
    type: "receipt",
    metadata: {
      orderId: order._id?.toString(),
      orderNumber,
    },
  });

  return result;
}

/**
 * Update the payment record with email status after sending
 */
export async function updatePaymentEmailStatus(orderId, status, errorMsg = null) {
  try {
    const sql = db();
    if (status === "sent") {
      await sql`
        UPDATE payments
        SET receipt_email_sent_at = now(),
            receipt_email_status = 'sent',
            receipt_email_error = null,
            updated_at = now()
        WHERE order_id = ${orderId}
      `;
    } else {
      await sql`
        UPDATE payments
        SET receipt_email_status = 'failed',
            receipt_email_error = ${String(errorMsg || "").slice(0, 500)},
            updated_at = now()
        WHERE order_id = ${orderId}
      `;
    }
  } catch (dbError) {
    console.error("[Receipt] Failed to update payment email status:", dbError.message);
  }
}