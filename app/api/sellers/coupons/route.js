import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const sql = db();
  const [seller] = await sql`SELECT id FROM sellers WHERE user_id = ${user._id}`;
  if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

  const coupons = await sql`SELECT * FROM seller_coupons WHERE seller_id = ${seller.id} ORDER BY created_at DESC`;
  return Response.json({ coupons });
}

export async function POST(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const sql = db();
    const [seller] = await sql`SELECT id FROM sellers WHERE user_id = ${user._id}`;
    if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

    const { code, discountType, discountValue, minPurchaseInPaise, maxUses, expiryDate } = await request.json();
    if (!code || !discountType || !discountValue) {
      return Response.json({ message: "Code, discount type, and value required" }, { status: 400 });
    }

    const [coupon] = await sql`
      INSERT INTO seller_coupons (seller_id, code, discount_type, discount_value, min_purchase_in_paise, max_uses, expiry_date)
      VALUES (${seller.id}, ${code.toUpperCase()}, ${discountType}, ${discountValue}, ${Number(minPurchaseInPaise) || 0}, ${Number(maxUses) || null}, ${expiryDate || null})
      RETURNING *
    `;

    return Response.json({ coupon }, { status: 201 });
  } catch (error) {
    if (error.message?.includes("violates unique constraint")) {
      return Response.json({ message: "Coupon code already exists" }, { status: 409 });
    }
    return Response.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const sql = db();
    const [seller] = await sql`SELECT id FROM sellers WHERE user_id = ${user._id}`;
    if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

    const { couponId, active } = await request.json();
    const [coupon] = await sql`
      UPDATE seller_coupons SET active = ${active}, updated_at = now() WHERE id = ${couponId} AND seller_id = ${seller.id} RETURNING *
    `;
    return Response.json({ coupon });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}