function getGeminiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
}

export function productText(product) {
  return [
    product.title,
    product.description,
    product.category,
    ...(product.tags || []),
  ]
    .filter(Boolean)
    .join(" ");
}

async function createGeminiEmbedding(input) {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    return null;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: {
          parts: [{ text: input }],
        },
      }),
    },
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.embedding?.values || null;
}

export async function createEmbedding(input) {
  if (!input?.trim()) {
    return null;
  }

  return createGeminiEmbedding(input);
}

export async function generateAssistantReply(message, products = [], context = {}) {
  const apiKey = getGeminiKey();
  if (!apiKey || !message?.trim()) {
    return null;
  }

  const catalog = products
    .slice(0, 8)
    .map((product) => {
      const price = context.priceInInr ? context.priceInInr(product) : Math.round(product.price || 0);
      return `${product.title} | ${product.category} | ₹${price} | ${product.description}`;
    })
    .join("\n");

  if (!catalog) {
    return null;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are DR MART's shopping assistant for an Indian e-commerce site.
Recommend only products from the catalog below.
Respect the customer's budget exactly. If they say under ₹5000, do not recommend anything above ₹5000.
Prefer products that match the use case words like college, laptop, bag, gift, student, travel.
Answer with 2-3 recommendations, prices in INR, and a short reason for the best pick.

Budget hint: ${context.budgetInr ? `₹${context.budgetInr}` : "not specified"}

Catalog:
${catalog}

Customer: ${message}`,
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}
