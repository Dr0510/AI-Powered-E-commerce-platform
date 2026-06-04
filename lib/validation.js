// Input validation utilities for security & data integrity

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateProductTitle(title) {
  const trimmed = String(title || "").trim();
  if (trimmed.length < 2) return null;
  if (trimmed.length > 200) return trimmed.substring(0, 200);
  return trimmed;
}

export function validatePrice(price) {
  const num = Number(price || 0);
  if (num < 0) return null;
  return Math.round(num * 100) / 100;
}

export function validateStock(stock) {
  const num = parseInt(stock || 0, 10);
  return num < 0 ? 0 : num;
}

export function validateCategory(category) {
  const trimmed = String(category || "General").trim();
  if (trimmed.length === 0) return "General";
  if (trimmed.length > 100) return trimmed.substring(0, 100);
  return trimmed;
}

export function validateTags(tags) {
  if (Array.isArray(tags)) {
    return tags
      .map(t => String(t || "").trim())
      .filter(t => t.length > 0 && t.length < 50)
      .slice(0, 10);
  }
  return String(tags || "")
    .split(",")
    .map(t => t.trim())
    .filter(t => t.length > 0 && t.length < 50)
    .slice(0, 10);
}

export function validateImageUrl(url) {
  if (!url) return null;
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

export function validateCloudinaryPublicId(publicId) {
  const trimmed = String(publicId || "").trim();
  if (!trimmed) return null;
  // Cloudinary public IDs contain alphanumeric, hyphens, underscores, slashes
  if (!/^[a-zA-Z0-9_\-\/]+$/.test(trimmed)) return null;
  return trimmed;
}

export function sanitizeHtml(html) {
  if (!html) return "";
  // Remove potentially dangerous tags/attributes
  return String(html)
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .substring(0, 5000);
}

export function validateFileUpload(file, maxSizeBytes = 5000000) {
  if (!file) return { valid: false, error: "No file provided" };
  
  const validMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validMimeTypes.includes(file.type)) {
    return { valid: false, error: "Only JPG, PNG, and WEBP images are allowed" };
  }
  
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size must be less than ${maxSizeBytes / 1000000}MB` };
  }
  
  return { valid: true, error: null };
}

export function validateSearchQuery(query) {
  const trimmed = String(query || "").trim();
  if (trimmed.length > 200) return trimmed.substring(0, 200);
  // Remove potentially harmful characters
  return trimmed.replace(/[<>]/g, "");
}
