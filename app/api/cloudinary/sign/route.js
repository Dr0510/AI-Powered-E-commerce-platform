import { v2 as cloudinary } from "cloudinary";
import { requireUser } from "@/lib/auth";
import { withRateLimit } from "@/lib/rateLimit";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function postHandler(request) {
  const { user, response } = await requireUser();
  if (response) {
    return response;
  }

  const body = await request.json().catch(() => ({}));
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!apiKey || !apiSecret || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    return Response.json(
      { message: "Cloudinary cloud name, API key, and API secret are required" },
      { status: 500 },
    );
  }

  const paramsToSign = body.paramsToSign || {
    timestamp: Math.round(Date.now() / 1000),
    folder: body.folder || "dr-mart/products",
    source: "uw",
  };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return Response.json({
    signature,
    apiKey,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  });
}

export const POST = withRateLimit(postHandler, { limit: 60, windowMs: 60 * 1000 });
