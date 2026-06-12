"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Store,
  Plus,
  Settings,
  ExternalLink,
  CheckCircle2,
  Copy,
} from "lucide-react";

export default function DashboardHero({ seller }) {
  if (!seller) return null;

  const shopName = seller.shop_name || "My Store";
  const initial = shopName.charAt(0).toUpperCase();
  const storeUrl = seller.shop_slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/store/${seller.shop_slug}`
    : null;

  return (
    <motion.section
      className="relative overflow-hidden rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-elevated)]/70 backdrop-blur-xl shadow-sm"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Banner gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-green)]/10 via-transparent to-[var(--brand-gold)]/8" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[var(--brand-green)]/5 to-transparent rounded-full blur-3xl" />

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-green-bright)] flex items-center justify-center text-3xl md:text-4xl font-black text-white shadow-xl shadow-[var(--brand-green)]/20">
                {seller.logo_url ? (
                  <img src={seller.logo_url} alt={shopName} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  initial
                )}
              </div>
              {seller.verification_badge && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--brand-green-bright)] border-2 border-[var(--surface-elevated)] flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">
                {shopName}
              </h1>
              {seller.verification_badge && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--badge-green-bg)] text-xs font-black text-[var(--badge-green-text)] border border-[var(--brand-green)]/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-xs font-black text-white shadow-sm">
                {seller.subscription_plan || "Standard"}
              </span>
            </div>

            {/* Store URL */}
            {storeUrl && (
              <div className="mt-2 flex items-center gap-2">
                <Link
                  href={`/store/${seller.shop_slug}`}
                  target="_blank"
                  className="text-sm text-[var(--text-accent)] hover:text-[var(--brand-green-bright)] font-medium hover:underline transition-all inline-flex items-center gap-1"
                >
                  <Store className="w-3.5 h-3.5" />
                  /store/{seller.shop_slug}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            <p className="mt-1 text-sm text-[var(--text-muted)] font-medium">
              Seller since {seller.created_at ? new Date(seller.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long" }) : "Today"}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/seller/products"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white text-sm font-black shadow-lg shadow-[var(--brand-green)]/20 hover:shadow-xl hover:shadow-[var(--brand-green)]/30 transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
            {storeUrl && (
              <Link
                href={`/store/${seller.shop_slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-[var(--text-primary)] text-sm font-black hover:bg-[var(--tab-hover-bg)] transition-all hover:-translate-y-0.5 shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View Store
              </Link>
            )}
            <Link
              href="/seller/settings"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-[var(--text-primary)] text-sm font-black hover:bg-[var(--tab-hover-bg)] transition-all hover:-translate-y-0.5 shadow-sm"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}