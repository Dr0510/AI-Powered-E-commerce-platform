import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateReceiptHTML } from "@/lib/pdf-receipt";
import { sendReceiptEmail } from "@/lib/receipt";
import { getOrderById } from "@/lib/postgres";
import { withRateLimit } from "@/lib/rateLimit";

export async function GET(request) {
  try {
    const { user, response } = await requireUser();
    if (response) {
      return response;
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const format = searchParams.get("format") || "html";

    if (!orderId) {
      return Response.json({ message: "orderId is required" }, { status: 400 });
    }

    const order = await getOrderById(orderId, user._id);

    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.status !== "paid") {
      return Response.json({ message: "Receipt only available for paid orders" }, { status: 400 });
    }

    const html = generateReceiptHTML(order);

    if (format === "view") {
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="receipt-${order._id.toString().slice(-8)}.html"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[ReceiptAPI:GET] Error:", error);
    return Response.json({ message: "Failed to generate receipt", error: error.message }, { status: 500 });
  }
}

async function postHandler(request) {
  try {
    const { user, response } = await requireUser();
    if (response) {
      return response;
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return Response.json({ message: "orderId is required" }, { status: 400 });
    }

    const order = await getOrderById(orderId, user._id);
    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.status !== "paid") {
      return Response.json({ message: "Receipt email only available for paid orders" }, { status: 400 });
    }

    // Validate that customer has an email
    const customerEmail = order.customer?.email || order.customer_email;
    if (!customerEmail) {
      console.error("[ReceiptAPI:POST] No customer email for order:", order._id);
      return Response.json(
        { message: "Customer email not found for this order. Cannot send receipt." },
        { status: 400 },
      );
    }

    const logMeta = { orderId: order._id.toString(), customerEmail };

    // Use the new sendReceiptEmail which has retry + dedup built in
    const result = await sendReceiptEmail(order);

    if (result.success) {
      await updatePaymentStatus(order._id, "sent", null);
      console.log("[ReceiptAPI:POST] Email sent successfully", logMeta);
      return Response.json({
        message: "Receipt emailed successfully",
        receiptEmailStatus: "sent",
        receiptEmailId: result.emailId,
      });
    }

    // If the send was skipped due to onboarding restriction, return a clear message
    if (result.skipped) {
      console.warn("[ReceiptAPI:POST] Email skipped:", result.reason, logMeta);
      await updatePaymentStatus(order._id, "skipped", result.reason);
      return Response.json({
        message: result.reason,
        skipped: true,
        receiptEmailStatus: "skipped",
      }, { status: 200 });
    }

    // Send failed after all retries
    console.error("[ReceiptAPI:POST] All retries failed:", result.error, logMeta);
    await updatePaymentStatus(order._id, "failed", result.error);

    return Response.json(
      { message: result.error || "Unable to email receipt" },
      { status: 500 },
    );
  } catch (error) {
    console.error("[ReceiptAPI:POST] Unexpected error:", error);
    return Response.json({ message: "Failed to email receipt", error: error.message }, { status: 500 });
  }
}

/**
 * Update the payment record with email delivery status
 */
async function updatePaymentStatus(orderId, status, errorMsg) {
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
    } else if (status === "skipped") {
      await sql`
        UPDATE payments
        SET receipt_email_status = 'skipped',
            receipt_email_error = ${String(errorMsg || "").slice(0, 500)},
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
    console.error("[ReceiptAPI] DB update error:", dbError.message);
  }
}

export const POST = withRateLimit(postHandler, { limit: 10, windowMs: 60 * 1000 });
