"use client";

import Link from "next/link";
import AuthControls from "@/components/AuthControls";

export function BrandMark() {
  return (
    <Link className="group flex items-center gap-3" href="/" aria-label="DR MART home">
      <span className="brand-mark relative inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[1.15rem] text-white shadow-[0_18px_44px_rgba(12,59,53,0.24)]">
        <span className="absolute inset-0 bg-[linear-gradient(135deg,#0c3b35_0%,#176e63_58%,#d1a04f_100%)]" />
        <span className="absolute inset-x-3 bottom-3 h-0.5 rounded-full bg-[#f4d7a1]" />
        <span className="relative text-[18px] font-black uppercase tracking-[0.08em]">DR</span>
      </span>
      <span className="leading-none">
        <span className="brand-wordmark block text-[1.08rem] font-black uppercase text-[#141c19]">DR MART</span>
        <span className="block pt-1 text-[10px] font-black uppercase tracking-[0.28em] text-[#8a6d43]">By DR Group</span>
      </span>
    </Link>
  );
}

export function StoreHeader({ cartCount = 0, user = null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#d8cbbb] bg-[#fffaf1]/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <BrandMark />
        <nav className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#3a322a]">
          <Link className="rounded px-3 py-2 hover:bg-[#efe4d4]" href="/">Shop</Link>
          <Link className="rounded px-3 py-2 hover:bg-[#efe4d4]" href="/wishlist">Wishlist</Link>
          <Link className="rounded px-3 py-2 hover:bg-[#efe4d4]" href="/orders">Orders</Link>
          <Link className="rounded px-3 py-2 hover:bg-[#efe4d4]" href="/profile">Profile</Link>
          <Link className="rounded bg-[#123f3a] px-3 py-2 text-white hover:bg-[#1d6b62]" href="/cart">
            Cart {cartCount ? `(${cartCount})` : ""}
          </Link>
          <span className="hidden text-xs text-[#7c6a55] md:inline">{user?.name || "Guest"}</span>
          <AuthControls compact />
        </nav>
      </div>
    </header>
  );
}

export function StatusPill({ children, tone = "green" }) {
  const styles = {
    green: "bg-[#dff1e9] text-[#145347]",
    gold: "bg-[#f7e3bd] text-[#6d4618]",
    rose: "bg-[#f7d7d4] text-[#7b2620]",
    ink: "bg-[#eee7dc] text-[#3a322a]",
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-black ${styles[tone]}`}>{children}</span>;
}

export function deliveryEstimate(stock = 0) {
  if (stock <= 0) return "Currently unavailable";
  if (stock < 6) return "Delivery in 4-5 days";
  return "Delivery by tomorrow";
}
