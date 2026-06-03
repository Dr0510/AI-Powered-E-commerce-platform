import connectDB from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { normalizePaise, paiseToRupees, priceInPaise } from "@/lib/format";
import { presentOrder } from "@/lib/orders";
import Order from "@/models/Order";
import Product from "@/models/Product";

export async function GET(request) {
  const { user, response } = await requireUser();
  if (response) {
    return response;
  }

  await connectDB();
  const { searchParams } = new URL(request.url);
  const adminView = searchParams.get("admin") === "true";

  if (adminView) {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }
  }

  const query = adminView ? {} : { user: user._id };
  const orders = await Order.find(query).sort({ createdAt: -1 }).limit(adminView ? 100 : 25).lean();
  return Response.json({ orders: orders.map(presentOrder) });
}

export async function POST(request) {
  try {
    const { user, response } = await requireUser();
    if (response) {
      return response;
    }

    const { items, shippingAddress } = await request.json();
    if (!items?.length) {
      return Response.json({ message: "Cart is empty" }, { status: 400 });
    }

    await connectDB();
    const ids = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: ids } }).lean();
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    const orderItems = items
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product || product.active === false) {
          return null;
        }

        const quantity = Math.max(1, Math.floor(Number(item.quantity || 1)));
        const productPriceInPaise = priceInPaise(product);

        return {
          product: product._id,
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
      const product = productMap.get(item.product.toString());
      if (!product || product.stock < item.quantity) {
        return Response.json({ message: `${item.title} has only ${product?.stock || 0} left` }, { status: 409 });
      }
    }

    const totalInPaise = normalizePaise(orderItems.reduce((sum, item) => sum + item.priceInPaise * item.quantity, 0));
    const order = await Order.create({
      user: user._id,
      clerkId: user.clerkId,
      customer: {
        name: user.name,
        email: user.email,
      },
      items: orderItems,
      totalInPaise,
      total: totalInPaise / 100,
      shippingAddress,
    });

    return Response.json({ order: presentOrder(order) }, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return Response.json({ message: "Unable to create order", error: error.message }, { status: 500 });
  }
}

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

    await connectDB();
    const order = await Order.findByIdAndUpdate(orderId, update, { new: true }).lean();
    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    return Response.json({ order: presentOrder(order) });
  } catch (error) {
    return Response.json({ message: "Unable to update order", error: error.message }, { status: 500 });
  }
}
