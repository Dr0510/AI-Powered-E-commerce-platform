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
    const format = searchParams.get("format") || "html"; // html or view

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

    // For format=html or default, return HTML that can be printed/saved as PDF
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="receipt-${order._id.toString().slice(-8)}.html"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
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

    try {
      const receiptResponse = await sendReceiptEmail(order);
      const sql = db();
      await sql`
        UPDATE payments
        SET receipt_email_sent_at = now(),
          receipt_email_status = 'sent',
          receipt_email_error = null,
          updated_at = now()
        WHERE order_id = ${order._id}
      `;

      return Response.json({
        message: "Receipt emailed to the customer",
        receiptEmailStatus: "sent",
        receiptEmailId: receiptResponse?.data?.id,
      });
    } catch (error) {
      const sql = db();
      await sql`
        UPDATE payments
        SET receipt_email_status = 'failed',
          receipt_email_error = ${String(error.message || error).slice(0, 500)},
          updated_at = now()
        WHERE order_id = ${order._id}
      `;

      return Response.json(
        { message: "Unable to email receipt", error: error.message },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error emailing receipt:", error);
    return Response.json({ message: "Failed to email receipt", error: error.message }, { status: 500 });
  }
}

export const POST = withRateLimit(postHandler, { limit: 10, windowMs: 60 * 1000 });
