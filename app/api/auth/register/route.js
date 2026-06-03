export async function POST() {
  return Response.json(
    { message: "Registration has been replaced by Clerk. Use the Clerk sign-up flow." },
    { status: 410 },
  );
}
