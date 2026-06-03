import connectDB from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { generateReceiptHTML } from "@/lib/pdf-receipt";
import Order from "@/models/Order";

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

    await connectDB();
    const order = await Order.findOne({ _id: orderId, user: user._id }).lean();

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
