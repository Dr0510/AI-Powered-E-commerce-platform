export function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function paiseToRupees(value) {
  return Math.round(Number(value || 0)) / 100;
}

export function rupeesToPaise(value) {
  return Math.max(0, Math.round(Number(value || 0) * 100));
}

export function moneyFromPaise(value) {
  return money(paiseToRupees(value));
}

export function ratingFor(product) {
  const seed = String(product?._id || product?.title || "").charCodeAt(0) || 4;
  return (4 + (seed % 8) / 10).toFixed(1);
}

export function discountFor(product) {
  const seed = String(product?.title || "").length;
  return 12 + (seed % 5) * 6;
}
