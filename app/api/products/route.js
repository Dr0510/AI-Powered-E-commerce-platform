import connectDB from "@/lib/db";
import { createEmbedding, productText } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";
import { presentProduct, productPayload } from "@/lib/catalog";
import Product from "@/models/Product";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const category = searchParams.get("category")?.trim();
    const ai = searchParams.get("ai") === "true";
    const includeInactive = searchParams.get("includeInactive") === "true";
    const filter = {
      ...(category ? { category } : {}),
      ...(includeInactive ? {} : { active: { $ne: false } }),
    };

    if (query && ai) {
      const embedding = await createEmbedding(query);
      if (embedding) {
        try {
          const products = await Product.aggregate([
            {
              $vectorSearch: {
                index: "product_vector_index",
                path: "embedding",
                queryVector: embedding,
                numCandidates: 100,
                limit: 12,
                filter,
              },
            },
            {
              $project: {
                embedding: 0,
                score: { $meta: "vectorSearchScore" },
              },
            },
          ]);

          return Response.json({ products: products.map(presentProduct), mode: "vector" });
        } catch {
          // Atlas Vector Search requires an index. Fall through to text search until it exists.
        }
      }
    }

    const mongoQuery = {
      ...filter,
      ...(query
        ? {
            $or: [
              { title: { $regex: query, $options: "i" } },
              { description: { $regex: query, $options: "i" } },
              { category: { $regex: query, $options: "i" } },
              { tags: { $regex: query, $options: "i" } },
            ],
          }
        : {}),
    };

    const products = await Product.find(mongoQuery).select("-embedding").sort({ createdAt: -1 }).lean();
    return Response.json({ products: products.map(presentProduct), mode: query ? "keyword" : "catalog" });
  } catch (error) {
    return Response.json({ message: "Unable to load products", error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { response } = await requireAdmin();
    if (response) {
      return response;
    }

    const body = await request.json();
    const payload = productPayload(body);
    if (!payload.title || !payload.priceInPaise) {
      return Response.json({ message: "Title and price are required" }, { status: 400 });
    }

    const embedding = await createEmbedding(productText(payload));

    await connectDB();
    const product = await Product.create({
      ...payload,
      embedding: embedding || [],
    });

    return Response.json({ product: presentProduct(product) }, { status: 201 });
  } catch (error) {
    return Response.json({ message: "Unable to create product", error: error.message }, { status: 500 });
  }
}
