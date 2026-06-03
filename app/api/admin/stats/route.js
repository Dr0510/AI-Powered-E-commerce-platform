import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { presentOrder } from "@/lib/orders";
import { presentProduct } from "@/lib/catalog";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) {
    return response;
  }

  await connectDB();

  const [products, users, orders, revenue, lowStock, recentOrders] = await Promise.all([
    Product.countDocuments({ active: { $ne: false } }),
    User.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$totalInPaise" } } }]),
    Product.find({ active: { $ne: false }, stock: { $lte: 15 } })
      .select("title category stock price priceInPaise images image")
      .sort({ stock: 1 })
      .limit(8)
      .lean(),
    Order.find().sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  return Response.json({
    products,
    users,
    orders,
    revenue: (revenue[0]?.total || 0) / 100,
    revenueInPaise: revenue[0]?.total || 0,
    lowStock: lowStock.map(presentProduct),
    recentOrders: recentOrders.map(presentOrder),
  });
}
