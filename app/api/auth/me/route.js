import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return Response.json({ user });
  } catch (error) {
    console.error("GET /api/auth/me failed:", error.message);
    return Response.json({ user: null, message: "Authentication service unavailable" }, { status: 503 });
  }
}
