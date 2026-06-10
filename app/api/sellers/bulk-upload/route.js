import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { invalidateProductCache } from "@/lib/cache";

export async function POST(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const sql = db();
    const [seller] = await sql`SELECT id, subscription_plan FROM sellers WHERE user_id = ${user._id}`;
    if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) return Response.json({ message: "CSV file required" }, { status: 400 });

    const text = await file.text();
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return Response.json({ message: "File must have header + at least 1 product" }, { status: 400 });

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const results = { success: 0, errors: [] };

    // Check product limit for basic plan
    if (seller.subscription_plan === 'basic') {
      const [{ count }] = await sql`SELECT COUNT(*) as count FROM seller_products WHERE seller_id = ${seller.id}`;
      const currentCount = Number(count);
      const toAdd = lines.length - 1;
      if (currentCount + toAdd > 10) {
        return Response.json({ message: `Free plan limited to 10 products (have ${currentCount}, trying to add ${toAdd}). Upgrade to Pro.` }, { status: 403 });
      }
    }

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map(v => v.trim());
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

        if (!row.title || !row.price) {
          results.errors.push(`Row ${i}: Title and price required`);
          continue;
        }

        const title = row.title;
        const price = parseFloat(row.price);
        if (isNaN(price) || price <= 0) {
          results.errors.push(`Row ${i}: Invalid price "${row.price}"`);
          continue;
        }

        const priceInPaise = Math.round(price * 100);
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const stock = parseInt(row.stock) || 0;
        const category = row.category || "General";
        const description = row.description || "";
        const tags = row.tags ? row.tags.split(";").map(t => t.trim()).filter(Boolean) : [];
        const image = row.image || "";

        const [product] = await sql`
          INSERT INTO products (title, slug, description, price_in_paise, category, image, stock, active, tags)
          VALUES (${title}, ${slug + "-" + Date.now() + i}, ${description}, ${priceInPaise}, ${category}, ${image}, ${stock}, true, ${tags})
          ON CONFLICT (slug) DO UPDATE SET price_in_paise = EXCLUDED.price_in_paise, stock = EXCLUDED.stock, updated_at = now()
          RETURNING id
        `;

        await sql`
          INSERT INTO seller_products (product_id, seller_id, seller_price_in_paise, stock)
          VALUES (${product.id}, ${seller.id}, ${priceInPaise}, ${stock})
          ON CONFLICT (product_id, seller_id) DO UPDATE SET seller_price_in_paise = EXCLUDED.seller_price_in_paise, stock = EXCLUDED.stock, updated_at = now()
        `;

        await sql`
          INSERT INTO inventory (product_id, quantity_on_hand)
          VALUES (${product.id}, ${stock})
          ON CONFLICT (product_id) DO UPDATE SET quantity_on_hand = EXCLUDED.quantity_on_hand, updated_at = now()
        `;

        results.success++;
      } catch (err) {
        results.errors.push(`Row ${i}: ${err.message}`);
      }
    }

    invalidateProductCache();
    return Response.json(results, { status: 201 });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}