import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const sql = db();
  const [seller] = await sql`SELECT id FROM sellers WHERE user_id = ${user._id}`;
  if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

  const [sellerData] = await sql`SELECT announcement_banner FROM sellers WHERE id = ${seller.id}`;
  return Response.json({ announcement: sellerData?.announcement_banner || "" });
}

export async function POST(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const sql = db();
    const [seller] = await sql`SELECT id FROM sellers WHERE user_id = ${user._id}`;
    if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

    const { message } = await request.json();
    await sql`
      UPDATE sellers SET announcement_banner = ${message || ""}, updated_at = now() WHERE id = ${seller.id}
    `;

    return Response.json({ announcement: message || "" });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}