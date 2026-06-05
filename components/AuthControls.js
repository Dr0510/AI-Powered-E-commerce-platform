"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

const clerkReady = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function AuthControls({ compact = false }) {
  if (!clerkReady) {
    return (
      <span className="rounded bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900">
        Add Clerk keys
      </span>
    );
  }

  return <ReadyAuthControls compact={compact} />;
}

function ReadyAuthControls({ compact }) {
  const { isSignedIn } = useUser();

  return (
    <div className={compact ? "flex items-center gap-2" : "flex flex-wrap items-center gap-2"}>
      {isSignedIn ? (
        <UserButton />
      ) : (
        <>
          <SignInButton mode="modal">
            <button className="rounded border border-[#d8cbbb] bg-white px-3 py-2 text-sm font-bold text-[#171412]" type="button">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded bg-[#123f3a] px-3 py-2 text-sm font-black text-white" type="button">
              Sign up
            </button>
          </SignUpButton>
        </>
      )}
    </div>
  );
}
