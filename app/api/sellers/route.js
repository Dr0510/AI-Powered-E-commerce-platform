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
    const body = await request.json();
    const { shopName, description, category } = body;
    if (!shopName) {
      return Response.json({ message: "Shop name is required" }, { status: 400 });
    }

    const sql = db();
    const slug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // Check if seller already exists for this user (draft)
    const [existing] = await sql`SELECT id FROM sellers WHERE user_id = ${user._id}`;
    if (existing) {
      // Update existing seller (save draft)
      const updateFields = { ...body };
      delete updateFields.shopName;
      // Map shopName to shop_name
      const [updated] = await sql`
        UPDATE sellers SET
          shop_name = ${shopName},
          shop_slug = ${slug},
          full_name = ${body.full_name || null},
          phone = ${body.phone || null},
          email = ${body.email || null},
          profile_photo_url = ${body.profile_photo_url || null},
          logo_url = ${body.logo_url || null},
          banner_url = ${body.banner_url || null},
          business_type = ${body.business_type || null},
          business_description = ${body.business_description || body.description || null},
          country = ${body.country || null},
          state = ${body.state || null},
          city = ${body.city || null},
          pincode = ${body.pincode || null},
          address = ${body.address || null},
          aadhaar_number = ${body.aadhaar_number || null},
          pan_number = ${body.pan_number || null},
          gst_number = ${body.gst_number || null},
          id_upload_url = ${body.id_upload_url || null},
          bank_details = ${JSON.stringify(body.bank_details || {})}::jsonb,
          description = ${body.business_description || body.description || null},
          category = ${body.store_category || category || null},
          shipping_options = ${body.shipping_options || null},
          return_policy = ${body.return_policy || null},
          store_policies = ${body.store_policies || null},
          updated_at = now()
        WHERE id = ${existing.id}
        RETURNING *
      `;
      return Response.json({ seller: updated });
    }

    const [seller] = await sql`
      INSERT INTO sellers (
        user_id, shop_name, shop_slug, full_name, phone, email,
        profile_photo_url, logo_url, banner_url, business_type,
        business_description, country, state, city, pincode, address,
        aadhaar_number, pan_number, gst_number, id_upload_url,
        bank_details, description, category, shipping_options,
        return_policy, store_policies
      ) VALUES (
        ${user._id}, ${shopName}, ${slug},
        ${body.full_name || null}, ${body.phone || null}, ${body.email || null},
        ${body.profile_photo_url || null}, ${body.logo_url || null}, ${body.banner_url || null},
        ${body.business_type || null}, ${body.business_description || body.description || null},
        ${body.country || null}, ${body.state || null}, ${body.city || null},
        ${body.pincode || null}, ${body.address || null},
        ${body.aadhaar_number || null}, ${body.pan_number || null},
        ${body.gst_number || null}, ${body.id_upload_url || null},
        ${JSON.stringify(body.bank_details || {})}::jsonb,
        ${body.business_description || body.description || null},
        ${body.store_category || category || null},
        ${body.shipping_options || null}, ${body.return_policy || null},
        ${body.store_policies || null}
      )
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

export async function DELETE(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const sql = db();

    // Get seller to find Cloudinary assets
    const [seller] = await sql`
      SELECT id, profile_photo_url, logo_url, banner_url, id_upload_url
      FROM sellers WHERE user_id = ${user._id}
    `;
    if (!seller) {
      return Response.json({ message: "Seller not found" }, { status: 404 });
    }

    // Delete Cloudinary assets first
    const { deleteSellerAssets } = await import("@/lib/cloudinary");
    const { deleted } = await deleteSellerAssets(seller);

    // Delete seller from database (CASCADE handles related records)
    await sql`DELETE FROM sellers WHERE id = ${seller.id}`;

    return Response.json({
      message: "Seller deleted successfully",
      cloudinaryAssetsDeleted: deleted,
    });
  } catch (error) {
    console.error("DELETE /api/sellers failed:", error.message);
    return Response.json({ message: error.message }, { status: 500 });
  }
}
