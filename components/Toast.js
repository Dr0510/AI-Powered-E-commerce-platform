"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const showToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { message, type, id, exiting: false }]);
    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
          delete timersRef.current[id];
        }, 320);
      }, duration);
    }
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timersRef.current[id];
    }, 320);
  }, []);

  return { toasts, showToast, dismissToast };
}

const TOAST_CONFIG = {
  success: { icon: "✓", accentVar: "--badge-green-text", bgVar: "--badge-green-bg" },
  error:   { icon: "✕", accentVar: "--badge-rose-text", bgVar: "--badge-rose-bg" },
  info:    { icon: "ℹ", accentVar: "--text-accent", bgVar: "--tab-active-bg" },
  warn:    { icon: "⚠", accentVar: "--badge-gold-text", bgVar: "--badge-gold-bg" },
};

export function ToastContainer({ toasts = [], toast, onDismiss }) {
  /* Support both old single-toast API and new multi-toast API */
  const items = toasts.length > 0 ? toasts : toast ? [{ ...toast, id: toast.id || 1 }] : [];

  if (!items.length) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {items.map((t) => {
        const config = TOAST_CONFIG[t.type] || TOAST_CONFIG.info;
        return (
          <div
            key={t.id}
            className={`toast-item ${t.exiting ? "toast-exit" : "toast-enter"}`}
            style={{
              "--toast-accent": `var(${config.accentVar})`,
              "--toast-bg": `var(${config.bgVar})`,
            }}
          >
            <span className="toast-icon">{config.icon}</span>
            <p className="toast-message">{t.message}</p>
            <button
              className="toast-close focus-ring"
              onClick={() => onDismiss?.(t.id)}
              aria-label="Dismiss notification"
              type="button"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
