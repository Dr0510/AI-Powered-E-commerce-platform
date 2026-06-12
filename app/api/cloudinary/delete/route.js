import { v2 as cloudinary } from "cloudinary";
import { requireUser } from "@/lib/auth";
import { withRateLimit } from "@/lib/rateLimit";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function postHandler(request) {
  try {
    const { user, response } = await requireUser();
    if (response) {
      return response;
    }

    const { publicId } = await request.json();
    if (!publicId) {
      return Response.json({ message: "publicId is required" }, { status: 400 });
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return Response.json({ message: "Image deleted" });
  } catch (error) {
    return Response.json({ message: "Unable to delete image", error: error.message }, { status: 500 });
  }
}

export const POST = withRateLimit(postHandler, { limit: 60, windowMs: 60 * 1000 });
