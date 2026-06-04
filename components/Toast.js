"use client";

import { useCallback, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "info", duration = 3000) => {
    setToast({ message, type, id: Date.now() });
    if (duration > 0) {
      setTimeout(() => setToast(null), duration);
    }
  }, []);

  return { toast, showToast };
}

export function ToastContainer({ toast }) {
  if (!toast) return null;

  const bgColor = {
    success: "bg-green-50 border-l-4 border-green-500",
    error: "bg-red-50 border-l-4 border-red-500",
    info: "bg-blue-50 border-l-4 border-blue-500",
    warn: "bg-yellow-50 border-l-4 border-yellow-500",
  }[toast.type] || "bg-blue-50 border-l-4 border-blue-500";

  const textColor = {
    success: "text-green-800",
    error: "text-red-800",
    info: "text-blue-800",
    warn: "text-yellow-800",
  }[toast.type] || "text-blue-800";

  const icon = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warn: "⚠",
  }[toast.type] || "ℹ";

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} p-4 rounded shadow-lg max-w-sm`}>
      <div className={`flex items-start gap-3 ${textColor}`}>
        <span className="font-bold text-lg">{icon}</span>
        <p className="font-medium">{toast.message}</p>
      </div>
    </div>
  );
}
