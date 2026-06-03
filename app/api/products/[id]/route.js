import connectDB from "@/lib/db";
import { createEmbedding, productText } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";
import { presentProduct, productPayload } from "@/lib/catalog";
import Product from "@/models/Product";

export async function GET(_request, { params }) {
  await connectDB();
  const { id } = await params;
  const product = await Product.findOne({ _id: id, active: { $ne: false } }).select("-embedding").lean();

  if (!product) {
    return Response.json({ message: "Product not found" }, { status: 404 });
  }

  return Response.json({ product: presentProduct(product) });
}

export async function PATCH(request, { params }) {
  try {
    const { response } = await requireAdmin();
    if (response) {
      return response;
    }

    const { id } = await params;
    const body = await request.json();
    const update = productPayload(body);

    const embedding = await createEmbedding(productText(update));
    if (embedding) {
      update.embedding = embedding;
    }

    await connectDB();
    const product = await Product.findByIdAndUpdate(id, update, { new: true }).select("-embedding");
    return Response.json({ product: presentProduct(product) });
  } catch (error) {
    return Response.json({ message: "Unable to update product", error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const { response } = await requireAdmin();
  if (response) {
    return response;
  }

  await connectDB();
  const { id } = await params;
  await Product.findByIdAndUpdate(id, { active: false });
  return Response.json({ message: "Product archived" });
}
