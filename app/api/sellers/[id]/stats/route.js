import { db } from "@/lib/db";

export async function GET(request, { params }) {
  const sql = db();
  const { id } = params;

  const [products] = await sql`SELECT COUNT(*) as count FROM seller_products WHERE seller_id = ${id}`;
  const [orders] = await sql`SELECT COUNT(*) as count FROM orders WHERE id IN (SELECT order_id FROM seller_payouts WHERE seller_id = ${id})`;
  const [reviews] = await sql`SELECT AVG(rating) as avg FROM seller_reviews WHERE seller_id = ${id}`;

  return Response.json({
    products: products?.count || 0,
    orders: orders?.count || 0,
    avgRating: reviews?.avg || 0
  });
}
