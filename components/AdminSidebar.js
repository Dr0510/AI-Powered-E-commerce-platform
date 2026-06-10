"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import ThemeToggle from "./ThemeToggle";
import AuthControls from "./AuthControls";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: "📊" },
  { label: "Products", href: "/admin/products", icon: "📦" },
  { label: "Orders", href: "/admin/orders", icon: "🛒" },
  { label: "Sellers", href: "/admin/sellers", icon: "🏪" },
  { label: "Users", href: "/admin/users", icon: "👥" },
  { label: "Analytics", href: "/admin/analytics", icon: "📈" },
  { label: "Settings", href: "/admin/settings", icon: "⚙️" },
];

export default function AdminSidebar({ collapsed, onToggle }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = useCallback((href) => {
    router.push(href);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      onToggle?.();
    }
  }, [router, onToggle]);

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "w-[72px] -translate-x-full md:translate-x-0" : "w-[260px] translate-x-0"
        }`}
      >
        {/* Sidebar glass background */}
        <div className="absolute inset-0 bg-[var(--surface-elevated)] border-r border-[var(--border-primary)] backdrop-blur-xl" />

        {/* Content */}
        <div className="relative flex flex-col h-full z-10">
          {/* Logo */}
          <div
            className="flex items-center gap-3 px-5 h-16 border-b border-[var(--border-subtle)] cursor-pointer"
            onClick={() => handleNavigate("/admin")}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-green-bright)] flex items-center justify-center text-white text-sm font-black flex-shrink-0">
              DM
            </div>
            {!collapsed && (
              <span className="font-black text-[var(--text-primary)] text-sm tracking-tight whitespace-nowrap">
                DR MART Admin
              </span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-[var(--brand-green)]/10 to-[var(--brand-green-bright)]/10 text-[var(--text-accent)] border border-[var(--brand-green)]/20"
                      : "text-[var(--text-secondary)] hover:bg-[var(--tab-hover-bg)] hover:text-[var(--text-primary)] border border-transparent"
                  }`}
                  type="button"
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {isActive && !collapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--brand-green-bright)]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom actions */}
          <div className="border-t border-[var(--border-subtle)] p-3 space-y-2">
            <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
              <ThemeToggle className="!w-9 !h-9 !rounded-lg !text-sm" />
              {!collapsed && (
                <button
                  onClick={() => router.push("/")}
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--tab-hover-bg)] transition-all"
                  type="button"
                >
                  ← Storefront
                </button>
              )}
            </div>
            {!collapsed && <AuthControls compact />}
          </div>
        </div>
      </aside>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="fixed top-3 left-3 z-50 w-10 h-10 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all md:top-4 md:left-4"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        type="button"
      >
        <span className="text-lg transition-transform duration-300" style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)" }}>
          ☰
        </span>
      </button>
    </>
  );
}