import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const sql = db();
    const { sellerId } = await request.json();
    if (!sellerId) return Response.json({ message: "Seller ID required" }, { status: 400 });

    // Prevent self-follow
    const [targetSeller] = await sql`SELECT user_id FROM sellers WHERE id = ${sellerId}`;
    if (!targetSeller) return Response.json({ message: "Seller not found" }, { status: 404 });
    if (targetSeller.user_id === user._id) {
      return Response.json({ message: "Cannot follow yourself" }, { status: 400 });
    }

    // Check if already following
    const [existing] = await sql`
      SELECT id FROM seller_followers WHERE seller_id = ${sellerId} AND follower_id = ${user._id}
    `;

    if (existing) {
      // Unfollow
      await sql`DELETE FROM seller_followers WHERE id = ${existing.id}`;
      await sql`UPDATE sellers SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = ${sellerId}`;
      return Response.json({ following: false });
    } else {
      // Follow
      await sql`
        INSERT INTO seller_followers (seller_id, follower_id) VALUES (${sellerId}, ${user._id})
      `;
      await sql`UPDATE sellers SET followers_count = followers_count + 1 WHERE id = ${sellerId}`;
      return Response.json({ following: true });
    }
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const sql = db();
  const following = await sql`
    SELECT sf.seller_id, s.shop_name, s.shop_slug, s.logo_url, s.description, s.verification_badge, s.performance_score
    FROM seller_followers sf
    JOIN sellers s ON s.id = sf.seller_id
    WHERE sf.follower_id = ${user._id}
    ORDER BY sf.created_at DESC
  `;

  return Response.json({ following });
}