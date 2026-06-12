"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import AuthControls from "./AuthControls";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  TicketPercent,
  Wallet,
  MessageSquare,
  Upload,
  Settings,
  LogOut,
  Store,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/seller/products", icon: Package },
  { label: "Orders", href: "/seller/orders", icon: ShoppingCart },
  { label: "Analytics", href: "/seller/analytics", icon: BarChart3 },
  { label: "Coupons", href: "/seller/coupons", icon: TicketPercent },
  { label: "Payouts", href: "/seller/payouts", icon: Wallet },
  { label: "Messages", href: "/seller/messages", icon: MessageSquare },
  { label: "Bulk Upload", href: "/seller/bulk-upload", icon: Upload },
  { label: "Settings", href: "/seller/settings", icon: Settings },
];

export default function SellerNav({ collapsed, onToggle }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = useCallback(
    (href) => {
      router.push(href);
      if (window.innerWidth < 1024) {
        onToggle?.();
      }
    },
    [router, onToggle]
  );

  const isActive = (href) => {
    if (href === "/seller/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full flex flex-col transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          collapsed ? "w-[72px] -translate-x-full md:translate-x-0" : "w-[260px] translate-x-0"
        }`}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-[var(--surface-elevated)] border-r border-[var(--border-primary)] backdrop-blur-xl" />
        {/* Subtle gradient accent on left edge */}
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[var(--brand-green)] via-[var(--brand-green-bright)] to-[var(--brand-gold)] opacity-40" />

        <div className="relative flex flex-col h-full z-10">
          {/* Brand header */}
          <div
            className="flex items-center gap-3 px-4 h-16 border-b border-[var(--border-subtle)] cursor-pointer group flex-shrink-0"
            onClick={() => handleNavigate("/seller/dashboard")}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-green-bright)] flex items-center justify-center text-white shadow-lg shadow-[var(--brand-green)]/20 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Store className="w-[18px] h-[18px]" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="block font-black text-[var(--text-primary)] text-sm tracking-tight truncate">
                  DR MART
                </span>
                <span className="block text-[10px] font-bold text-[var(--text-muted)] truncate">
                  Seller Center
                </span>
              </div>
            )}
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-[var(--brand-green)]/10 to-[var(--brand-green-bright)]/10 text-[var(--text-accent)] border border-[var(--brand-green)]/20 shadow-sm"
                      : "text-[var(--text-secondary)] hover:bg-[var(--tab-hover-bg)] hover:text-[var(--text-primary)] border border-transparent"
                  }`}
                  type="button"
                >
                  <Icon
                    className={`w-[18px] h-[18px] flex-shrink-0 transition-all duration-200 ${
                      active ? "text-[var(--brand-green-bright)]" : ""
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {active && (
                    <>
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-[var(--brand-green)] to-[var(--brand-green-bright)] shadow-sm" />
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--brand-green-bright)] shadow-sm" />
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-[var(--border-subtle)] p-3 space-y-2 flex-shrink-0">
            <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
              <ThemeToggle className="!w-9 !h-9 !rounded-lg !text-sm" />
              {!collapsed && (
                <button
                  onClick={() => router.push("/")}
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--tab-hover-bg)] transition-all flex items-center gap-2"
                  type="button"
                >
                  <Store className="w-3.5 h-3.5" />
                  Storefront
                </button>
              )}
            </div>
            {!collapsed && <AuthControls compact />}
          </div>
        </div>
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--tab-hover-bg)] hover:shadow-lg transition-all"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        type="button"
      >
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </motion.div>
      </button>
    </>
  );
}