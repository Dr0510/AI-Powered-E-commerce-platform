import { db } from "@/lib/db";
import { validateCoupon } from "@/lib/checkout";
import { requireUser } from "@/lib/auth";

export async function POST(request) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const { code, subtotal } = await request.json();

    if (!code) {
      return Response.json({ valid: false, message: "Coupon code is required" }, { status: 400 });
    }

    const result = await validateCoupon(code, Number(subtotal || 0), user._id);
    return Response.json(result);
  } catch (error) {
    console.error("Coupon validation error:", error);
    return Response.json({ valid: false, message: "Unable to validate coupon" }, { status: 500 });
  }
}