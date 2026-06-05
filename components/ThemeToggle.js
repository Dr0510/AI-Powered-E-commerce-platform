"use client";

import { useCallback, useEffect, useState } from "react";

/* ─── Shared theme hook ─── */
export function useTheme() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = localStorage.getItem("dr-theme");
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(stored || current || "light");
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("dr-theme", next);
      return next;
    });
  }, []);

  return { theme, toggle };
}

/* ─── Theme toggle button ─── */
export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
