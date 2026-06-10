import { requireUser } from "@/lib/auth";
import { withRateLimit } from "@/lib/rateLimit";

async function getHandler() {
  try {
    const { response } = await requireUser();
    if (response) {
      return response;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

    if (!cloudName || !apiKey) {
      return Response.json(
        { cloudName: null, apiKey: null, message: "Cloudinary not configured" },
        { status: 200 },
      );
    }

    return Response.json({ cloudName, apiKey });
  } catch (error) {
    console.error("GET /api/cloudinary/config failed:", error.message);
    return Response.json({ cloudName: null, apiKey: null, message: "Service unavailable" }, { status: 200 });
  }
}

export const GET = withRateLimit(getHandler, { limit: 60, windowMs: 60 * 1000 });
