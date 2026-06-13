"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import AuthControls from "@/components/AuthControls";
import ThemeToggle from "@/components/ThemeToggle";

export function BrandMark() {
  return (
    <Link className="group flex items-center gap-3" href="/" aria-label="DR MART home">
      <span className="brand-mark relative inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[1.15rem] text-white shadow-[0_18px_44px_rgba(12,59,53,0.24)]">
        <span className="absolute inset-0 bg-[linear-gradient(135deg,#0c3b35_0%,#176e63_58%,#d1a04f_100%)]" />
        <span className="absolute inset-x-3 bottom-3 h-0.5 rounded-full bg-[#f4d7a1]" />
        <span className="relative text-[18px] font-black uppercase tracking-[0.08em]">DR</span>
      </span>
      <span className="leading-none">
        <span className="brand-wordmark block text-[1.08rem] font-black uppercase themed-text-primary">DR MART</span>
        <span className="block pt-1 text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: "var(--brand-gold)" }}>By DR Group</span>
      </span>
    </Link>
  );
}

export function StoreHeader({ cartCount = 0, user = null, onCartClick }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const prevCount = useRef(cartCount);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (cartCount !== prevCount.current) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 400);
      prevCount.current = cartCount;
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  function isActive(href) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function navLinkClass(href, extra = "") {
    const base = `store-nav-link ${extra}`;
    return isActive(href) ? `${base} active-link` : base;
  }

  return (
    <>
      <a className="skip-nav" href="#main-content">Skip to content</a>
      <header className={`store-header${scrolled ? " scrolled" : ""}`} role="banner">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <BrandMark />

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <button
              className="mobile-nav-toggle"
              onClick={() => setMobileOpen(true)}
              type="button"
              aria-label="Open navigation menu"
            >
              ☰
            </button>
          </div>

          <nav
            className={`store-nav flex flex-wrap items-center gap-2 text-sm font-bold ${mobileOpen ? "open" : ""}`}
            role="navigation"
            aria-label="Main navigation"
          >
            <button
              className="mobile-nav-close"
              onClick={() => setMobileOpen(false)}
              type="button"
              aria-label="Close navigation menu"
            >
              ✕
            </button>

            <Link className={navLinkClass("/")} href="/" onClick={() => setMobileOpen(false)}>Shop</Link>
            <Link className={navLinkClass("/sellers")} href="/sellers" onClick={() => setMobileOpen(false)}>🏪 Sellers</Link>
            <Link className={navLinkClass("/leaderboard")} href="/leaderboard" onClick={() => setMobileOpen(false)}>🏆 Top Sellers</Link>
            <Link className={`ai-nav-link rounded px-3 py-2${isActive("/ai") ? " active-link" : ""}`} href="/ai" onClick={() => setMobileOpen(false)}>✨ AI Hub</Link>
            <Link className={navLinkClass("/wishlist")} href="/wishlist" onClick={() => setMobileOpen(false)}>Wishlist</Link>
            <Link className={navLinkClass("/orders")} href="/orders" onClick={() => setMobileOpen(false)}>Orders</Link>
            <Link className={navLinkClass("/profile")} href="/profile" onClick={() => setMobileOpen(false)}>Profile</Link>
            <Link className={navLinkClass("/seller")} href="/seller/dashboard" onClick={() => setMobileOpen(false)}>📊 Seller</Link>
            <button className={`store-cart-btn${cartBounce ? " cart-bounce" : ""}`} onClick={onCartClick} type="button">
              🛒 Cart {cartCount ? `(${cartCount})` : ""}
            </button>
            <span className="hidden text-xs md:inline" style={{ color: "var(--text-muted)" }}>{user?.name || "Guest"}</span>
            <AuthControls compact />
          </nav>
        </div>
      </header>
    </>
  );
}

export function StatusPill({ children, tone = "green" }) {
  const styles = {
    green: { background: "var(--badge-green-bg)", color: "var(--badge-green-text)" },
    gold: { background: "var(--badge-gold-bg)", color: "var(--badge-gold-text)" },
    rose: { background: "var(--badge-rose-bg)", color: "var(--badge-rose-text)" },
    ink: { background: "var(--surface-secondary)", color: "var(--text-secondary)" },
  };

  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-black"
      style={styles[tone] || styles.green}
    >
      {children}
    </span>
  );
}

export function deliveryEstimate(stock = 0) {
  if (stock <= 0) return "Currently unavailable";
  if (stock < 6) return "Delivery in 4-5 days";
  return "Delivery by tomorrow";
}
