export function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function normalizePaise(value) {
  return Math.max(0, Math.round(Number(value || 0)));
}

export function paiseToRupees(value) {
  return normalizePaise(value) / 100;
}

export function rupeesToPaise(value) {
  return normalizePaise(Number(value || 0) * 100);
}

export function moneyFromPaise(value) {
  return money(paiseToRupees(value));
}

export function priceInPaise(value) {
  if (value?.priceInPaise !== undefined && value.priceInPaise !== null) {
    return normalizePaise(value.priceInPaise);
  }
  if (value?.price_in_paise !== undefined && value.price_in_paise !== null) {
    return normalizePaise(value.price_in_paise);
  }

  return rupeesToPaise(value?.price);
}

export function ratingFor(product) {
  const seed = String(product?._id || product?.title || "").charCodeAt(0) || 4;
  return (4 + (seed % 8) / 10).toFixed(1);
}

export function discountFor(product) {
  const seed = String(product?.title || "").length;
  return 12 + (seed % 5) * 6;
}
