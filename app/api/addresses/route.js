import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const sql = db();
    const addresses = await sql`
      SELECT id, name, line1, city, state, country, phone, pincode, address_type, is_default, created_at
      FROM addresses
      WHERE user_id = ${user._id}
      ORDER BY is_default DESC, created_at DESC
    `;

    return Response.json({ addresses });
  } catch (error) {
    console.error("Address fetch error:", error);
    return Response.json({ message: "Unable to fetch addresses" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const { name, line1, line2, city, state, country, phone, pincode, addressType, isDefault } = await request.json();

    if (!name?.trim() || !line1?.trim() || !city?.trim() || !phone?.trim()) {
      return Response.json({ message: "Name, address, city, and phone are required" }, { status: 400 });
    }

    if (pincode && !/^[0-9]{6}$/.test(pincode.replace(/\D/g, ""))) {
      return Response.json({ message: "Enter a valid 6-digit pincode" }, { status: 400 });
    }

    if (phone && !/^[0-9]{10}$/.test(phone.replace(/\D/g, ""))) {
      return Response.json({ message: "Enter a valid 10-digit phone number" }, { status: 400 });
    }

    const sql = db();
    const setDefault = Boolean(isDefault);

    if (setDefault) {
      await sql`
        UPDATE addresses SET is_default = false, updated_at = now()
        WHERE user_id = ${user._id}
      `;
    }

    const [address] = await sql`
      INSERT INTO addresses (user_id, name, line1, city, state, country, phone, pincode, address_type, is_default)
      VALUES (
        ${user._id},
        ${name.trim()},
        ${line1.trim()},
        ${city.trim()},
        ${(state || "").trim()},
        ${(country || "India").trim()},
        ${phone.trim()},
        ${(pincode || "").trim()},
        ${addressType || "home"},
        ${setDefault}
      )
      RETURNING id, name, line1, city, state, country, phone, pincode, address_type, is_default, created_at
    `;

    return Response.json({ address }, { status: 201 });
  } catch (error) {
    console.error("Address creation error:", error);
    return Response.json({ message: "Unable to save address" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const { addressId, name, line1, city, state, country, phone, pincode, addressType, isDefault } = await request.json();

    if (!addressId) {
      return Response.json({ message: "Address ID is required" }, { status: 400 });
    }

    const sql = db();

    const [existing] = await sql`
      SELECT id FROM addresses WHERE id = ${addressId} AND user_id = ${user._id} LIMIT 1
    `;
    if (!existing) {
      return Response.json({ message: "Address not found" }, { status: 404 });
    }

    const setDefault = Boolean(isDefault);
    if (setDefault) {
      await sql`
        UPDATE addresses SET is_default = false, updated_at = now()
        WHERE user_id = ${user._id} AND id != ${addressId}
      `;
    }

    const [address] = await sql`
      UPDATE addresses SET
        name = COALESCE(${name || null}, name),
        line1 = COALESCE(${line1 || null}, line1),
        city = COALESCE(${city || null}, city),
        state = COALESCE(${state || null}, state),
        country = COALESCE(${country || null}, country),
        phone = COALESCE(${phone || null}, phone),
        pincode = COALESCE(${pincode || null}, pincode),
        address_type = COALESCE(${addressType || null}, address_type),
        is_default = COALESCE(${setDefault || null}, is_default),
        updated_at = now()
      WHERE id = ${addressId} AND user_id = ${user._id}
      RETURNING id, name, line1, city, state, country, phone, pincode, address_type, is_default, created_at
    `;

    return Response.json({ address });
  } catch (error) {
    console.error("Address update error:", error);
    return Response.json({ message: "Unable to update address" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get("id");

    if (!addressId) {
      return Response.json({ message: "Address ID is required" }, { status: 400 });
    }

    const sql = db();
    const [deleted] = await sql`
      DELETE FROM addresses WHERE id = ${addressId} AND user_id = ${user._id}
      RETURNING id, is_default
    `;

    if (!deleted) {
      return Response.json({ message: "Address not found" }, { status: 404 });
    }

    if (deleted.is_default) {
      const [nextDefault] = await sql`
        SELECT id FROM addresses WHERE user_id = ${user._id}
        ORDER BY created_at DESC LIMIT 1
      `;
      if (nextDefault) {
        await sql`
          UPDATE addresses SET is_default = true, updated_at = now() WHERE id = ${nextDefault.id}
        `;
      }
    }

    return Response.json({ message: "Address deleted" });
  } catch (error) {
    console.error("Address delete error:", error);
    return Response.json({ message: "Unable to delete address" }, { status: 500 });
  }
}