import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { user, response } = await requireAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const offset = (page - 1) * limit;

    const sql = db();

    let whereClause = sql`1=1`;
    if (search) {
      whereClause = sql`(u.name ILIKE ${'%' + search + '%'} OR u.email ILIKE ${'%' + search + '%'})`;
    }
    if (role) {
      whereClause = sql`${whereClause} AND u.role = ${role}`;
    }

    const [usersResult, countResult] = await Promise.all([
      sql`
        SELECT
          u.id, u.clerk_id, u.name, u.email, u.role, u.created_at, u.updated_at,
          count(o.id)::int AS order_count,
          COALESCE(sum(o.total_in_paise) FILTER (WHERE o.status = 'paid'), 0)::int AS total_spent_in_paise,
          (SELECT count(*)::int FROM reviews r WHERE r.user_id = u.id) AS review_count,
          (SELECT count(*)::int FROM wishlists w WHERE w.user_id = u.id) AS wishlist_count
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id
        WHERE ${whereClause}
        GROUP BY u.id, u.clerk_id, u.name, u.email, u.role, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT count(*)::int AS total
        FROM users u
        WHERE ${whereClause}
      `
    ]);

    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      users: usersResult.map(u => ({
        _id: u.id,
        id: u.id,
        clerkId: u.clerk_id,
        name: u.name,
        email: u.email,
        role: u.role,
        orderCount: u.order_count,
        totalSpentInPaise: u.total_spent_in_paise,
        reviewCount: u.review_count,
        wishlistCount: u.wishlist_count,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/admin/users failed:", error.message);
    return NextResponse.json({ users: [], total: 0, page: 1, limit: 50, totalPages: 0 }, { status: 200 });
  }
}