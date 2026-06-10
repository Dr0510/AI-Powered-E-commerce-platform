import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const sql = db();
    const sellers = await sql`
      SELECT s.*, u.name as owner_name, u.email as owner_email,
        (SELECT COUNT(*) FROM seller_products WHERE seller_id = s.id) as product_count,
        (SELECT COUNT(*) FROM seller_reviews WHERE seller_id = s.id) as review_count
      FROM sellers s
      JOIN users u ON u.id = s.user_id
      ORDER BY s.created_at DESC
    `;

    return Response.json({ sellers: sellers || [] });
  } catch (error) {
    console.error("GET /api/admin/sellers failed:", error.message);
    return Response.json({ sellers: [], message: error.message }, { status: 200 });
  }
}

export async function PATCH(request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const sql = db();
    const body = await request.json();
    const { sellerId } = body;

    if (!sellerId) {
      return Response.json({ message: "sellerId is required" }, { status: 400 });
    }

    // Build dynamic UPDATE query
    const setClauses = [];
    const values = [];

    if (body.verificationStatus !== undefined) {
      setClauses.push(`verification_status = $${values.length + 1}`);
      values.push(body.verificationStatus);
      setClauses.push(`verification_badge = $${values.length + 1}`);
      values.push(body.verificationStatus === "verified");
    }
    if (body.commissionRate !== undefined) {
      setClauses.push(`commission_rate = $${values.length + 1}`);
      values.push(body.commissionRate);
    }
    if (body.subscriptionPlan !== undefined) {
      setClauses.push(`subscription_plan = $${values.length + 1}`);
      values.push(body.subscriptionPlan);
    }

    if (setClauses.length === 0) {
      return Response.json({ message: "No fields to update" }, { status: 400 });
    }

    setClauses.push(`updated_at = now()`);

    const query = `
      UPDATE sellers SET ${setClauses.join(", ")}
      WHERE id = $${values.length + 1}
      RETURNING *
    `;
    values.push(sellerId);

    const result = await sql.query(query, values);
    const seller = result.rows?.[0] || result[0];

    if (!seller) {
      return Response.json({ message: "Seller not found" }, { status: 404 });
    }

    return Response.json({ seller });
  } catch (error) {
    console.error("PATCH /api/admin/sellers failed:", error.message);
    return Response.json({ message: error.message }, { status: 500 });
  }
}