import { db } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const verified = searchParams.get("verified");

    const sql = db();

    let sellers;
    if (slug) {
      sellers = await sql`
        SELECT * FROM sellers WHERE shop_slug = ${slug} ORDER BY followers_count DESC
      `;
    } else if (verified === "true") {
      sellers = await sql`
        SELECT * FROM sellers WHERE verification_status = 'verified' ORDER BY followers_count DESC
      `;
    } else {
      sellers = await sql`
        SELECT * FROM sellers ORDER BY followers_count DESC
      `;
    }

    return Response.json({ sellers: sellers || [] });
  } catch (error) {
    console.error("GET /api/sellers failed:", error.message);
    return Response.json({ sellers: [], message: error.message }, { status: 200 });
  }
}

export async function POST(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const { shopName, description, category } = await request.json();
    if (!shopName) {
      return Response.json({ message: "Shop name is required" }, { status: 400 });
    }

    const sql = db();
    const slug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    
    const [seller] = await sql`
      INSERT INTO sellers (user_id, shop_name, shop_slug, description, category)
      VALUES (${user._id}, ${shopName}, ${slug}, ${description || ""}, ${category || "General"})
      RETURNING *
    `;

    return Response.json({ seller }, { status: 201 });
  } catch (error) {
    console.error("POST /api/sellers failed:", error.message);
    return Response.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const { sellerId, ...updates } = await request.json();
    if (!sellerId) {
      return Response.json({ message: "sellerId is required" }, { status: 400 });
    }

    const sql = db();

    const [seller] = await sql`
      UPDATE sellers
      SET ${sql(updates)}, updated_at = now()
      WHERE id = ${sellerId} AND user_id = ${user._id}
      RETURNING *
    `;

    return Response.json({ seller });
  } catch (error) {
    console.error("PATCH /api/sellers failed:", error.message);
    return Response.json({ message: error.message }, { status: 500 });
  }
}
