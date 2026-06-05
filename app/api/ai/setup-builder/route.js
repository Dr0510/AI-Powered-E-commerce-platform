import { db } from "@/lib/db";
import { presentProduct } from "@/lib/catalog";
import { productFromRow } from "@/lib/postgres";
import { ensureDatabaseSchema } from "@/lib/schema";

const SETUP_TYPES = {
  coding: {
    label: "Coding Setup",
    slots: [
      { name: "Laptop", emoji: "💻", share: 0.58, categories: ["Electronics", "Laptops"], keywords: ["laptop", "notebook", "macbook", "thinkpad"] },
      { name: "Monitor", emoji: "🖥️", share: 0.20, categories: ["Electronics", "Monitors"], keywords: ["monitor", "display", "screen"] },
      { name: "Keyboard", emoji: "⌨️", share: 0.11, categories: ["Electronics", "Accessories"], keywords: ["keyboard", "mechanical", "typing"] },
      { name: "Mouse", emoji: "🖱️", share: 0.11, categories: ["Electronics", "Accessories"], keywords: ["mouse", "trackpad", "wireless mouse"] },
    ],
  },
  gaming: {
    label: "Gaming Setup",
    slots: [
      { name: "Gaming Laptop", emoji: "🎮", share: 0.55, categories: ["Electronics", "Laptops"], keywords: ["gaming", "laptop", "gpu", "rtx"] },
      { name: "Monitor", emoji: "🖥️", share: 0.22, categories: ["Electronics", "Monitors"], keywords: ["monitor", "144hz", "display"] },
      { name: "Headset", emoji: "🎧", share: 0.13, categories: ["Electronics", "Accessories"], keywords: ["headphone", "headset", "earbuds", "audio"] },
      { name: "Mouse", emoji: "🖱️", share: 0.10, categories: ["Electronics", "Accessories"], keywords: ["mouse", "gaming mouse"] },
    ],
  },
  office: {
    label: "Office Setup",
    slots: [
      { name: "Laptop", emoji: "💻", share: 0.50, categories: ["Electronics", "Laptops"], keywords: ["laptop", "business", "notebook"] },
      { name: "Monitor", emoji: "🖥️", share: 0.22, categories: ["Electronics", "Monitors"], keywords: ["monitor", "display"] },
      { name: "Keyboard", emoji: "⌨️", share: 0.10, categories: ["Electronics", "Accessories"], keywords: ["keyboard"] },
      { name: "Webcam", emoji: "📷", share: 0.10, categories: ["Electronics", "Accessories"], keywords: ["webcam", "camera", "video"] },
      { name: "Mouse", emoji: "🖱️", share: 0.08, categories: ["Electronics", "Accessories"], keywords: ["mouse", "ergonomic"] },
    ],
  },
  photography: {
    label: "Photography Setup",
    slots: [
      { name: "Camera", emoji: "📷", share: 0.50, categories: ["Electronics", "Cameras"], keywords: ["camera", "dslr", "mirrorless"] },
      { name: "Lens", emoji: "🔭", share: 0.25, categories: ["Electronics", "Accessories"], keywords: ["lens", "zoom", "prime"] },
      { name: "Tripod", emoji: "📐", share: 0.13, categories: ["Accessories"], keywords: ["tripod", "stand", "mount"] },
      { name: "Memory Card", emoji: "💾", share: 0.12, categories: ["Electronics", "Accessories"], keywords: ["memory", "sd card", "storage"] },
    ],
  },
};

function scoreForSlot(product, slot, slotBudget) {
  const haystack = [product.title, product.description, product.category, ...(product.tags || [])].join(" ").toLowerCase();
  const priceInr = Math.round((product.price_in_paise || product.priceInPaise || 0) / 100) || product.price || 0;
  let score = 0;

  // Keyword matches
  for (const kw of slot.keywords) {
    if (haystack.includes(kw)) score += 10;
  }

  // Category match
  if (slot.categories.some((c) => product.category === c)) score += 8;

  // Price fitness: prefer items close to but under slot budget
  if (priceInr > 0 && priceInr <= slotBudget) {
    score += 6;
    // Closer to budget = better value
    score += Math.round((priceInr / slotBudget) * 4);
  } else if (priceInr > slotBudget) {
    score -= 20;
  }

  // In stock bonus
  if (product.stock > 0) score += 3;

  return score;
}

export async function POST(request) {
  try {
    const { budget, type = "coding" } = await request.json();
    const budgetInr = Number(budget);
    if (!budgetInr || budgetInr < 5000) {
      return Response.json({ message: "Budget must be at least ₹5,000" }, { status: 400 });
    }

    const setup = SETUP_TYPES[type] || SETUP_TYPES.coding;
    await ensureDatabaseSchema();
    const sql = db();

    const rows = await sql`
      SELECT id, title, slug, description, price_in_paise, category, image, images, stock, active, tags, created_at, updated_at
      FROM products
      WHERE active = true
      ORDER BY created_at DESC
      LIMIT 200
    `;

    const allProducts = rows.map(productFromRow);
    const usedIds = new Set();
    const items = [];
    let totalCost = 0;

    for (const slot of setup.slots) {
      const slotBudget = Math.round(budgetInr * slot.share);
      const scored = allProducts
        .filter((p) => !usedIds.has(p._id))
        .map((p) => ({ ...p, slotScore: scoreForSlot(p, slot, slotBudget) }))
        .filter((p) => p.slotScore > 0)
        .sort((a, b) => b.slotScore - a.slotScore);

      const pick = scored[0] || null;
      const priceInr = pick ? (Math.round((pick.priceInPaise || 0) / 100) || pick.price || 0) : 0;

      items.push({
        slot: slot.name,
        emoji: slot.emoji,
        budget: slotBudget,
        product: pick ? presentProduct(pick) : null,
        price: priceInr,
      });

      if (pick) {
        usedIds.add(pick._id);
        totalCost += priceInr;
      }
    }

    return Response.json({
      type,
      label: setup.label,
      budget: budgetInr,
      items,
      totalCost,
      savings: budgetInr - totalCost,
      underBudget: totalCost <= budgetInr,
    });
  } catch (error) {
    return Response.json({ message: "Setup builder error", error: error.message }, { status: 500 });
  }
}
