/**
 * Cloudinary utility for seller image management.
 * 
 * Handles image upload, replacement, and deletion for:
 * - Profile photos
 * - Store logos
 * - Store banners
 * - ID uploads
 * 
 * NEVER stores raw image data in database.
 * Only stores { secure_url, public_id } pairs.
 */

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Validates an image file before upload.
 * @param {File} file - The file to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  const extension = file.name?.split(".").pop()?.toLowerCase();
  if (!extension || !ALLOWED_FORMATS.includes(extension)) {
    return { valid: false, error: `Invalid format. Allowed: ${ALLOWED_FORMATS.join(", ")}` };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File too large. Maximum size: 5MB` };
  }

  if (!file.type?.startsWith("image/")) {
    return { valid: false, error: "File must be an image" };
  }

  return { valid: true };
}

/**
 * Build Cloudinary upload config from environment.
 * @returns {{ cloudName: string, apiKey: string, uploadPreset: string }}
 */
export function getCloudinaryConfig() {
  return {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "",
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "dr-mart",
  };
}

/**
 * Uploads an image file to Cloudinary.
 * @param {File} file - The image file to upload
 * @param {string} folder - Cloudinary folder (e.g., "seller-profiles", "seller-logos")
 * @returns {Promise<{ secure_url: string, public_id: string } | null>}
 */
export async function uploadToCloudinary(file, folder = "seller-uploads") {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "dr-mart");
  formData.append("folder", `dr-mart/${folder}`);
  formData.append("resource_type", "image");

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  const data = await res.json();

  if (!data.secure_url || !data.public_id) {
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }

  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
  };
}

/**
 * Deletes an image from Cloudinary by public_id.
 * @param {string} publicId - The Cloudinary public_id to delete
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteFromCloudinary(publicId) {
  if (!publicId) {
    return { success: false };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return { success: result.result === "ok" };
  } catch (error) {
    console.error("Cloudinary delete failed:", error.message);
    return { success: false };
  }
}

/**
 * Extracts Cloudinary public_id from a Cloudinary URL.
 * @param {string} url - Full Cloudinary URL
 * @returns {string|null} The public_id or null if not a Cloudinary URL
 */
export function extractPublicId(url) {
  if (!url || !url.includes("cloudinary")) return null;

  // Pattern: /v{version}/{folder}/{public_id}.{ext}
  try {
    const parts = url.split("/");
    const versionIndex = parts.findIndex(p => p.startsWith("v") && /^\d+$/.test(p.slice(1)));
    if (versionIndex === -1) return null;

    const pathParts = parts.slice(versionIndex + 1);
    const fullPath = pathParts.join("/");
    // Remove extension
    const dotIndex = fullPath.lastIndexOf(".");
    return dotIndex > -1 ? fullPath.slice(0, dotIndex) : fullPath;
  } catch {
    return null;
  }
}

/**
 * Replaces an old Cloudinary image with a new one.
 * Uploads the new file first, then deletes the old asset.
 * @param {File} file - New image file
 * @param {string} folder - Cloudinary folder
 * @param {string|null} oldPublicId - Previous public_id to delete
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export async function replaceCloudinaryImage(file, folder, oldPublicId = null) {
  // Upload new image first
  const result = await uploadToCloudinary(file, folder);

  // Delete old image if it exists (fire and forget)
  if (oldPublicId) {
    deleteFromCloudinary(oldPublicId).catch(() => {});
  }

  return result;
}

/**
 * Deletes all Cloudinary assets associated with a seller.
 * @param {Object} seller - Seller object with image URLs
 * @returns {Promise<{ deleted: number }>}
 */
export async function deleteSellerAssets(seller) {
  if (!seller) return { deleted: 0 };

  const publicIds = [
    seller.profile_photo_url ? extractPublicId(seller.profile_photo_url) : null,
    seller.logo_url ? extractPublicId(seller.logo_url) : null,
    seller.banner_url ? extractPublicId(seller.banner_url) : null,
    seller.id_upload_url ? extractPublicId(seller.id_upload_url) : null,
  ].filter(Boolean);

  let deleted = 0;
  for (const publicId of publicIds) {
    const result = await deleteFromCloudinary(publicId);
    if (result.success) deleted++;
  }

  return { deleted };
}