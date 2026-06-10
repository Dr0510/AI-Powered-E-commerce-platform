import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const sql = db();
    const [seller] = await sql`SELECT * FROM sellers WHERE user_id = ${user._id}`;

    if (!seller) {
      return Response.json({ seller: null, message: "Not a seller" }, { status: 200 });
    }
    return Response.json({ seller });
  } catch (error) {
    console.error("GET /api/sellers/me failed:", error.message);
    return Response.json({ seller: null, message: error.message }, { status: 200 });
  }
}