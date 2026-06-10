import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get("sellerId");
  if (!sellerId) return Response.json({ message: "sellerId required" }, { status: 400 });

  const sql = db();
  const reviews = await sql`
    SELECT sr.*, u.name as buyer_name
    FROM seller_reviews sr
    JOIN users u ON u.id = sr.buyer_id
    WHERE sr.seller_id = ${sellerId}
    ORDER BY sr.created_at DESC
  `;

  const [{ avg }] = await sql`SELECT COALESCE(AVG(rating), 0) as avg FROM seller_reviews WHERE seller_id = ${sellerId}`;
  const [{ count }] = await sql`SELECT COUNT(*) as count FROM seller_reviews WHERE seller_id = ${sellerId}`;

  return Response.json({ reviews, avgRating: Number(avg).toFixed(1), totalReviews: Number(count) });
}

export async function POST(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const sql = db();
    const { sellerId, rating, comment } = await request.json();
    if (!sellerId || !rating) {
      return Response.json({ message: "Seller ID and rating required" }, { status: 400 });
    }

    const [existing] = await sql`SELECT id FROM seller_reviews WHERE seller_id = ${sellerId} AND buyer_id = ${user._id}`;
    if (existing) {
      return Response.json({ message: "You already reviewed this seller" }, { status: 409 });
    }

    const [review] = await sql`
      INSERT INTO seller_reviews (seller_id, buyer_id, rating, comment)
      VALUES (${sellerId}, ${user._id}, ${rating}, ${comment || ""})
      RETURNING *
    `;

    // Update seller performance score
    const [{ avg }] = await sql`SELECT COALESCE(AVG(rating), 0) as avg FROM seller_reviews WHERE seller_id = ${sellerId}`;
    await sql`UPDATE sellers SET performance_score = ${Number(avg).toFixed(2)}, updated_at = now() WHERE id = ${sellerId}`;

    return Response.json({ review }, { status: 201 });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}