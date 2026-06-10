"use client";

import { useCallback, useSyncExternalStore } from "react";

/* ─── Shared theme hook ─── */
const themeListeners = new Set();

function notifyThemeChange() {
  themeListeners.forEach((cb) => cb());
}

function readTheme() {
  if (typeof window === "undefined") return "light";
  try {
    return localStorage.getItem("dr-theme") || document.documentElement.getAttribute("data-theme") || "light";
  } catch {
    return "light";
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (callback) => {
      themeListeners.add(callback);
      return () => themeListeners.delete(callback);
    },
    readTheme,
    () => "light",
  );

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("dr-theme", next);
    notifyThemeChange();
  }, [theme]);

  return { theme, toggle };
}

/* ─── Theme toggle button ─── */
export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) return <div className={`theme-toggle ${className}`} aria-hidden="true" />;

  return (
    <button
      className={`theme-toggle focus-ring ${className}`}
      onClick={toggle}
      type="button"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="theme-icon" key={theme}>
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </button>
  );
}