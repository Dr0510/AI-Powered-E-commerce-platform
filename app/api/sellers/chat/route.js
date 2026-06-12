import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const sql = db();
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");

  const [seller] = await sql`SELECT id, shop_name FROM sellers WHERE user_id = ${user._id}`;
  if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

  if (customerId) {
    const messages = await sql`
      SELECT * FROM seller_chat WHERE seller_id = ${seller.id} AND customer_id = ${customerId} ORDER BY created_at ASC
    `;
    return Response.json({ messages });
  }

  // Get conversations (unique customers)
  const conversations = await sql`
    SELECT DISTINCT ON (sc.customer_id) 
      sc.customer_id,
      sc.message as last_message,
      sc.sender_type as last_sender,
      sc.created_at as last_message_at,
      u.name as customer_name,
      u.email as customer_email
    FROM seller_chat sc
    JOIN users u ON u.id = sc.customer_id
    WHERE sc.seller_id = ${seller.id}
    ORDER BY sc.customer_id, sc.created_at DESC
  `;

  return Response.json({ conversations });
}

export async function POST(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const sql = db();
    const body = await request.json();
    const { sellerId, customerId, message } = body;

    if (!message) {
      return Response.json({ message: "Message required" }, { status: 400 });
    }

    // Check if the user is a seller
    const [seller] = await sql`SELECT id FROM sellers WHERE user_id = ${user._id}`;

    if (seller && customerId) {
      // Seller sending message to customer
      const [chat] = await sql`
        INSERT INTO seller_chat (seller_id, customer_id, message, sender_type)
        VALUES (${seller.id}, ${customerId}, ${message}, 'seller')
        RETURNING *
      `;
      return Response.json({ chat }, { status: 201 });
    } else if (sellerId) {
      // Customer sending message to seller (or seller messaging another seller's customer)
      const [sellerRecord] = await sql`SELECT id FROM sellers WHERE id = ${sellerId}`;
      if (!sellerRecord) return Response.json({ message: "Seller not found" }, { status: 404 });

      // Use the current user as the customer
      const [chat] = await sql`
        INSERT INTO seller_chat (seller_id, customer_id, message, sender_type)
        VALUES (${sellerId}, ${user._id}, ${message}, 'customer')
        RETURNING *
      `;
      return Response.json({ chat }, { status: 201 });
    } else {
      return Response.json({ message: "Either sellerId or customerId required" }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}
