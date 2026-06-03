import { rupeesToPaise, paiseToRupees } from "@/lib/format";

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function priceInPaiseFromBody(body) {
  if (body.priceInPaise !== undefined) {
    return Math.max(0, Math.round(Number(body.priceInPaise || 0)));
  }

  return rupeesToPaise(body.price);
}

export function primaryImage(product) {
  return product.images?.[0]?.url || product.image || "";
}

export function presentProduct(product) {
  const plain = typeof product.toObject === "function" ? product.toObject() : product;
  const priceInPaise =
    plain.priceInPaise !== undefined && plain.priceInPaise !== null
      ? plain.priceInPaise
      : rupeesToPaise(plain.price);

  return {
    ...plain,
    _id: plain._id?.toString?.() || plain._id,
    priceInPaise,
    price: paiseToRupees(priceInPaise),
    image: primaryImage(plain),
    images: plain.images || [],
    tags: plain.tags || [],
    active: plain.active !== false,
  };
}

export function productPayload(body) {
  const title = String(body.title || "").trim();
  const imageUrl = body.image || body.images?.[0]?.url || "";
  const images = body.images?.length
    ? body.images
    : imageUrl
      ? [{ url: imageUrl, publicId: body.imagePublicId || "", alt: title }]
      : [];

  return {
    title,
    slug: slugify(body.slug || title),
    description: String(body.description || "").trim(),
    priceInPaise: priceInPaiseFromBody(body),
    category: String(body.category || "General").trim(),
    image: images[0]?.url || "",
    images,
    stock: Math.max(0, Number(body.stock || 0)),
    active: body.active !== false,
    tags: normalizeTags(body.tags),
  };
}
