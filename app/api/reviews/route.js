import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { reviewFromRow } from "@/lib/postgres";
import { withRateLimit } from "@/lib/rateLimit";
import { ensureDatabaseSchema } from "@/lib/schema";

export async function GET(request) {
  await ensureDatabaseSchema();

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

  const user = await getCurrentUser().catch(() => null);
  let canReview = false;
  if (user) {
    const [eligible] = await sql`
      SELECT 1
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ${user._id}
        AND oi.product_id = ${productId}
        AND o.status = 'paid'
        AND o.fulfillment_status = 'delivered'
      LIMIT 1
    `;
    canReview = Boolean(eligible);
  }

  return Response.json({ reviews: reviews.map(reviewFromRow), canReview });
}

async function postHandler(request) {
  try {
    const { user, response } = await requireUser();
    if (response) {
      return response;
    }

    const { productId, rating, comment } = await request.json();
    if (!productId) {
      return Response.json({ message: "productId is required" }, { status: 400 });
    }

    const sql = db();
    const normalizedRating = Math.max(1, Math.min(5, Math.floor(Number(rating || 0))));
    if (!normalizedRating) {
      return Response.json({ message: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const [eligible] = await sql`
      SELECT 1
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ${user._id}
        AND oi.product_id = ${productId}
        AND o.status = 'paid'
        AND o.fulfillment_status = 'delivered'
      LIMIT 1
    `;

    if (!eligible) {
      return Response.json(
        { message: "Only customers with a delivered order for this product can review it." },
        { status: 403 },
      );
    }

    const [review] = await sql`
      INSERT INTO reviews (product_id, user_id, user_name, rating, comment)
      VALUES (${productId}, ${user._id}, ${user.name}, ${normalizedRating}, ${comment || ""})
      RETURNING id, product_id, user_id, user_name, rating, comment, created_at, updated_at
    `;

    return Response.json({ review: reviewFromRow(review) }, { status: 201 });
  } catch (error) {
    return Response.json({ message: "Unable to save review", error: error.message }, { status: 500 });
  }
}

export const POST = withRateLimit(postHandler, { limit: 30, windowMs: 60 * 1000 });
