import connectDB from "@/lib/db";
import { generateAssistantReply } from "@/lib/ai";
import { presentProduct } from "@/lib/catalog";
import Product from "@/models/Product";

function extractBudgetInr(message) {
  const normalized = message.toLowerCase();
  const budgetMatch = normalized.match(/(?:under|below|less than|within|budget|upto|up to)\s*(?:rs\.?|₹|inr)?\s*(\d{3,7})/i);
  const plainRupeeMatch = normalized.match(/(?:₹|rs\.?|inr)\s*(\d{3,7})/i);
  const value = budgetMatch?.[1] || plainRupeeMatch?.[1];
  return value ? Number(value) : null;
}

function tokensFor(message) {
  const stopWords = new Set(["best", "good", "gift", "under", "below", "less", "than", "for", "and", "the", "a", "an", "college", "student", "please", "suggest"]);
  return message
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function intentFor(message) {
  const normalized = message.toLowerCase();
  if (/\b(smartphone|mobile|phone|android|iphone)\b/.test(normalized)) {
    return {
      name: "smartphone",
      keywords: ["smartphone", "mobile", "phone", "android", "iphone"],
      category: "Mobiles",
    };
  }

  if (/\b(backpack|laptop bag|bag)\b/.test(normalized)) {
    return {
      name: "bag",
      keywords: ["backpack", "bag", "laptop", "college", "student"],
      category: "Accessories",
    };
  }

  if (/\b(headphone|headphones|earbuds|speaker|audio)\b/.test(normalized)) {
    return {
      name: "audio",
      keywords: ["headphone", "headphones", "earbuds", "speaker", "audio", "wireless"],
      category: "Electronics",
    };
  }

  return null;
}

function priceInInr(product) {
  const priceInPaise =
    product.priceInPaise !== undefined && product.priceInPaise !== null
      ? product.priceInPaise
      : Math.round(Number(product.price || 0) * 100);
  return Math.round(priceInPaise / 100);
}

function scoreProduct(product, messageTokens, rawMessage, budgetInr) {
  const haystack = [
    product.title,
    product.description,
    product.category,
    ...(product.tags || []),
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  const intent = intentFor(rawMessage);
  const matchesIntent = intent
    ? product.category === intent.category || intent.keywords.some((keyword) => haystack.includes(keyword))
    : true;

  if (intent && !matchesIntent) {
    return -100;
  }

  for (const token of messageTokens) {
    if (haystack.includes(token)) {
      score += 4;
    }
  }

  const normalized = rawMessage.toLowerCase();
  if (normalized.includes("bag") && haystack.includes("bag")) score += 8;
  if (normalized.includes("laptop") && haystack.includes("laptop")) score += 8;
  if (normalized.includes("smartphone") && haystack.includes("smartphone")) score += 14;
  if (normalized.includes("phone") && haystack.includes("phone")) score += 10;
  if (normalized.includes("mobile") && haystack.includes("mobile")) score += 10;
  if (intent && product.category === intent.category) score += 8;
  if (normalized.includes("college") && (haystack.includes("college") || haystack.includes("student"))) score += 6;
  if (normalized.includes("gift") && haystack.includes("gift")) score += 3;
  if (budgetInr && priceInInr(product) <= budgetInr) score += 6;
  if (budgetInr && priceInInr(product) > budgetInr) score -= 20;

  return score;
}

function fallbackReply(message, products, budgetInr) {
  const intent = intentFor(message || "");
  if (!products.length) {
    if (intent && budgetInr) {
      return `I could not find a ${intent.name} under ₹${budgetInr}. Try increasing the budget or browse ${intent.category}.`;
    }

    return budgetInr
      ? `I could not find a strong match under ₹${budgetInr}. Try increasing the budget or browsing categories.`
      : "I could not find a strong match. Try searching by category, budget, or use case.";
  }

  const lines = products.slice(0, 3).map((product, index) => {
    return `${index + 1}. ${product.title} - ₹${priceInInr(product)}: ${product.description}`;
  });

  return [
    budgetInr ? `Best matches under ₹${budgetInr}:` : "Best matches:",
    ...lines,
    "My top pick is the first item because it best matches your need and budget.",
  ].join("\n");
}

export async function POST(request) {
  try {
    const { message } = await request.json();
    await connectDB();

    const budgetInr = extractBudgetInr(message || "");
    const messageTokens = tokensFor(message || "");
    const products = await Product.find({ active: { $ne: false } }).select("-embedding").lean();
    const rankedProducts = products
      .map((product) => ({
        ...product,
        assistantScore: scoreProduct(product, messageTokens, message || "", budgetInr),
      }))
      .filter((product) => product.assistantScore > 0)
      .sort((a, b) => b.assistantScore - a.assistantScore || priceInInr(a) - priceInInr(b))
      .slice(0, 8);

    const reply =
      (await generateAssistantReply(message, rankedProducts, { budgetInr, priceInInr })) ||
      fallbackReply(message, rankedProducts, budgetInr);

    return Response.json({ reply, products: rankedProducts.slice(0, 4).map(presentProduct) });
  } catch (error) {
    return Response.json({ message: "Assistant unavailable", error: error.message }, { status: 500 });
  }
}
