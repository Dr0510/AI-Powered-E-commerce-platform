import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userFromRow } from "@/lib/postgres";

function adminEmails() {
  return new Set(
    String(process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email) {
  return Boolean(email && adminEmails().has(email.toLowerCase()));
}

export async function getCurrentUser({ sync = true } = {}) {

  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const name =
    clerkUser?.fullName ||
    clerkUser?.username ||
    email?.split("@")[0] ||
    "Customer";

  if (!email) {
    return {
      _id: userId,
      clerkId: userId,
      name,
      email: "",
      role: "customer",
    };
  }

  if (!sync) {
    return {
      _id: userId,
      clerkId: userId,
      name,
      email,
      role: isAdminEmail(email) ? "admin" : "customer",
    };
  }

  const sql = db();
  const role = isAdminEmail(email) ? "admin" : "customer";
  const [user] = await sql`
    INSERT INTO users (clerk_id, name, email, role)
    VALUES (${userId}, ${name}, ${email}, ${role})
    ON CONFLICT (email)
    DO UPDATE SET
      clerk_id = EXCLUDED.clerk_id,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      updated_at = now()
    RETURNING id, clerk_id, name, email, role, created_at, updated_at
  `;

  return publicUser(userFromRow(user));
}

export async function requireUser() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        user: null,
        response: Response.json({ message: "Sign in required" }, { status: 401 }),
      };
    }

    return { user, response: null };
  } catch (error) {
    console.error("requireUser failed:", error.message);
    return {
      user: null,
      response: Response.json({ message: "Authentication service unavailable" }, { status: 503 }),
    };
  }
}

export async function requireAdmin() {
  try {
    const { user, response } = await requireUser();
    if (response) {
      return { user: null, response };
    }

    if (user.role !== "admin") {
      return {
        user,
        response: Response.json({ message: "Admin access required" }, { status: 403 }),
      };
    }

    return { user, response: null };
  } catch (error) {
    return {
      user: null,
      response: Response.json({ message: "Authentication service unavailable" }, { status: 503 }),
    };
  }
}

export function publicUser(user) {
  return {
    _id: user._id,
    clerkId: user.clerkId,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
