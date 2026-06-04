import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { normalizePaise, paiseToRupees, priceInPaise } from "@/lib/format";
import { presentOrder } from "@/lib/orders";
import { getOrderById, listOrders } from "@/lib/postgres";
import { withRateLimit } from "@/lib/rateLimit";

export async function GET(request) {
  const { user, response } = await requireUser();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const adminView = searchParams.get("admin") === "true";

  if (adminView) {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }
  }

  const orders = await listOrders({ userId: adminView ? null : user._id, limit: adminView ? 100 : 25 });
  return Response.json({ orders: orders.map(presentOrder) });
}

async function postHandler(request) {
  try {
    const { user, response } = await requireUser();
    if (response) {
      return response;
    }

    const { items, shippingAddress } = await request.json();
    if (!items?.length) {
      return Response.json({ message: "Cart is empty" }, { status: 400 });
    }

    const sql = db();
    const ids = items.map((item) => item.productId);
    const products = await sql`
      SELECT id, title, price_in_paise, category, image, images, stock, active
      FROM products
      WHERE id = ANY(${ids})
    `;
    const productMap = new Map(products.map((product) => [product.id, product]));

    const orderItems = items
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product || product.active === false) {
          return null;
        }

        const quantity = Math.max(1, Math.floor(Number(item.quantity || 1)));
        const productPriceInPaise = priceInPaise(product);

        return {
          product: product.id,
          productId: product.id,
          title: product.title,
          image: product.images?.[0]?.url || product.image,
          price: paiseToRupees(productPriceInPaise),
          priceInPaise: productPriceInPaise,
          quantity,
        };
      })
      .filter(Boolean);

    if (!orderItems.length) {
      return Response.json({ message: "No valid products in cart" }, { status: 400 });
    }

    for (const item of orderItems) {
      const product = productMap.get(item.productId);
      if (!product || product.stock < item.quantity) {
        return Response.json({ message: `${item.title} has only ${product?.stock || 0} left` }, { status: 409 });
      }
    }

    const totalInPaise = normalizePaise(orderItems.reduce((sum, item) => sum + item.priceInPaise * item.quantity, 0));
    const [order] = await sql`
      INSERT INTO orders (
        user_id, clerk_id, customer_name, customer_email, total_in_paise, currency,
        shipping_name, shipping_line1, shipping_city, shipping_country, shipping_phone, shipping_pincode
      )
      VALUES (
        ${user._id},
        ${user.clerkId},
        ${user.name},
        ${user.email},
        ${totalInPaise},
        'INR',
        ${shippingAddress?.name || user.name},
        ${shippingAddress?.line1 || ""},
        ${shippingAddress?.city || ""},
        ${shippingAddress?.country || "India"},
        ${shippingAddress?.phone || ""},
        ${shippingAddress?.pincode || ""}
      )
      RETURNING id
    `;

    for (const item of orderItems) {
      await sql`
        INSERT INTO order_items (order_id, product_id, title, image, price_in_paise, quantity)
        VALUES (${order.id}, ${item.productId}, ${item.title}, ${item.image}, ${item.priceInPaise}, ${item.quantity})
      `;
    }

    const createdOrder = await getOrderById(order.id, user._id);

    return Response.json({ order: presentOrder(createdOrder) }, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return Response.json({ message: "Unable to create order", error: error.message }, { status: 500 });
  }
}

export const POST = withRateLimit(postHandler);

export async function PATCH(request) {
  try {
    const { response } = await requireAdmin();
    if (response) {
      return response;
    }

    const { orderId, fulfillmentStatus, status } = await request.json();
    if (!orderId) {
      return Response.json({ message: "orderId is required" }, { status: 400 });
    }

    const allowedFulfillment = new Set(["unfulfilled", "packed", "shipped", "delivered", "cancelled"]);
    const update = {};
    if (fulfillmentStatus && allowedFulfillment.has(fulfillmentStatus)) {
      update.fulfillmentStatus = fulfillmentStatus;
    }
    if (status === "cancelled") {
      update.status = "cancelled";
      update.fulfillmentStatus = "cancelled";
    }

    const sql = db();
    const setFulfillment = update.fulfillmentStatus || null;
    const setStatus = update.status || null;
    const [updatedOrder] = await sql`
      UPDATE orders
      SET fulfillment_status = COALESCE(${setFulfillment}, fulfillment_status),
        status = COALESCE(${setStatus}, status),
        updated_at = now()
      WHERE id = ${orderId}
      RETURNING id
    `;
    const order = updatedOrder ? await getOrderById(updatedOrder.id) : null;
    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    return Response.json({ order: presentOrder(order) });
  } catch (error) {
    return Response.json({ message: "Unable to update order", error: error.message }, { status: 500 });
  }
}
