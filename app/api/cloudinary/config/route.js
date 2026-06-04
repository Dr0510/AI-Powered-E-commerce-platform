import { requireAdmin } from "@/lib/auth";
import { withRateLimit } from "@/lib/rateLimit";

async function getHandler() {
  const { response } = await requireAdmin();
  if (response) {
    return response;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

  if (!cloudName || !apiKey) {
    return Response.json(
      { message: "Cloudinary cloud name and API key are required" },
      { status: 500 },
    );
  }

  return Response.json({ cloudName, apiKey });
}

export const GET = withRateLimit(getHandler, { limit: 60, windowMs: 60 * 1000 });
