export async function POST() {
  return Response.json(
    { message: "Logout is handled by Clerk on the client." },
    { status: 410 },
  );
}
