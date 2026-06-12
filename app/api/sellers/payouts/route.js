import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const sql = db();
  const [seller] = await sql`SELECT id, total_earnings FROM sellers WHERE user_id = ${user._id}`;
  if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

  const payouts = await sql`
    SELECT * FROM seller_payouts WHERE seller_id = ${seller.id} ORDER BY created_at DESC
  `;

  // Calculate available balance (earnings - payouts)
  // total_earnings is stored in rupees (numeric), payouts are in paise (bigint)
  const [{ paid }] = await sql`
    SELECT COALESCE(SUM(amount_in_paise), 0) as paid FROM seller_payouts WHERE seller_id = ${seller.id} AND status = 'completed'
  `;

  const totalEarningsInPaise = Math.round(Number(seller.total_earnings || 0) * 100);
  const paidAmount = Number(paid);
  const availableBalance = Math.max(0, totalEarningsInPaise - paidAmount);

  return Response.json({
    payouts,
    totalEarnings: seller.total_earnings,
    availableBalance,
    paidSoFar: paidAmount,
  });
}

export async function POST(request) {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const sql = db();
    const [seller] = await sql`SELECT id, total_earnings FROM sellers WHERE user_id = ${user._id}`;
    if (!seller) return Response.json({ message: "Not a seller" }, { status: 404 });

    const { amount, bankAccount, upi } = await request.json();
    if (!amount || (!bankAccount && !upi)) {
      return Response.json({ message: "Amount and bank/UPI details required" }, { status: 400 });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const [{ paid }] = await sql`
      SELECT COALESCE(SUM(amount_in_paise), 0) as paid FROM seller_payouts WHERE seller_id = ${seller.id} AND status IN ('completed', 'processing')
    `;
    const totalEarningsInPaise = Math.round(Number(seller.total_earnings || 0) * 100);
    const availableBalance = Math.max(0, totalEarningsInPaise - Number(paid));

    if (amountInPaise > availableBalance) {
      return Response.json({ message: "Insufficient balance" }, { status: 400 });
    }

    const [payout] = await sql`
      INSERT INTO seller_payouts (seller_id, amount_in_paise, bank_account, upi)
      VALUES (${seller.id}, ${amountInPaise}, ${bankAccount || null}, ${upi || null})
      RETURNING *
    `;

    return Response.json({ payout }, { status: 201 });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const sql = db();
    const { payoutId, status, transactionId } = await request.json();
    const [payout] = await sql`
      UPDATE seller_payouts SET status = ${status}, transaction_id = COALESCE(${transactionId || null}, transaction_id), updated_at = now() WHERE id = ${payoutId} RETURNING *
    `;
    return Response.json({ payout });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
}