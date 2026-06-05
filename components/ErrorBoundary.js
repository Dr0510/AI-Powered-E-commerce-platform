"use client";

import { useEffect } from "react";

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error("Error caught by boundary:", error);
  }, [error]);

  return (
    <div className="luxury-shell flex min-h-screen items-center justify-center">
      <div className="glass-panel max-w-md rounded p-8">
        <div className="mb-4 h-1 w-16 rounded bg-[#c38b46]" />
        <h1 className="text-2xl font-black mb-2">Something went wrong</h1>
        <p className="text-slate-600 mb-4">{error?.message || "An unexpected error occurred"}</p>
        <button
          onClick={() => reset()}
          className="w-full rounded bg-[#123f3a] px-4 py-2 font-bold text-white hover:bg-[#1d6b62]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
