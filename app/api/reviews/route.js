import connectDB from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Review from "@/models/Review";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return Response.json({ message: "productId is required" }, { status: 400 });
  }

  await connectDB();
  const reviews = await Review.find({ product: productId }).sort({ createdAt: -1 }).lean();
  return Response.json({ reviews });
}

export async function POST(request) {
  try {
    const { user, response } = await requireUser();
    if (response) {
      return response;
    }

    const { productId, rating, comment } = await request.json();
    await connectDB();

    const review = await Review.create({
      product: productId,
      user: user._id,
      userName: user.name,
      rating: Number(rating),
      comment,
    });

    return Response.json({ review }, { status: 201 });
  } catch (error) {
    return Response.json({ message: "Unable to save review", error: error.message }, { status: 500 });
  }
}
