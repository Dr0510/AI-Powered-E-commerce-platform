import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { reviewFromRow } from "@/lib/postgres";
import { withRateLimit } from "@/lib/rateLimit";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return Response.json({ message: "productId is required" }, { status: 400 });
  }

  const sql = db();
  const reviews = await sql`
    SELECT id, product_id, user_id, user_name, rating, comment, created_at, updated_at
    FROM reviews
    WHERE product_id = ${productId}
    ORDER BY created_at DESC
  `;
  return Response.json({ reviews: reviews.map(reviewFromRow) });
}

async function postHandler(request) {
  try {
    const { user, response } = await requireUser();
    if (response) {
      return response;
    }

    const { productId, rating, comment } = await request.json();
    const sql = db();

    const [review] = await sql`
      INSERT INTO reviews (product_id, user_id, user_name, rating, comment)
      VALUES (${productId}, ${user._id}, ${user.name}, ${Number(rating)}, ${comment || ""})
      RETURNING id, product_id, user_id, user_name, rating, comment, created_at, updated_at
    `;

    return Response.json({ review: reviewFromRow(review) }, { status: 201 });
  } catch (error) {
    return Response.json({ message: "Unable to save review", error: error.message }, { status: 500 });
  }
}

export const POST = withRateLimit(postHandler, { limit: 30, windowMs: 60 * 1000 });
