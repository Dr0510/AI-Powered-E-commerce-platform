export async function POST() {
  return Response.json(
    { message: "Password login has been replaced by Clerk. Use the Clerk sign-in flow." },
    { status: 410 },
  );
}
