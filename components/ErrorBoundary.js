"use client";

import { useEffect } from "react";

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error("Error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h1 className="text-2xl font-black mb-2">Something went wrong</h1>
        <p className="text-slate-600 mb-4">{error?.message || "An unexpected error occurred"}</p>
        <button
          onClick={() => reset()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
