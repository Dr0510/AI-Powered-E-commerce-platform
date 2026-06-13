"use client";

import Link from "next/link";
import { BrandMark } from "./StoreShell";

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-[var(--border-primary)] bg-[var(--surface-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <BrandMark />
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
              DR MART by DR Group is an independent premium marketplace connecting
              verified sellers with discerning buyers. Curated quality, secure
              payments, and transparent tracking.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex h-7 w-10 items-center justify-center rounded border border-[var(--border-primary)] bg-white text-[9px] font-bold text-[var(--text-muted)]">
                Visa
              </span>
              <span className="inline-flex h-7 w-10 items-center justify-center rounded border border-[var(--border-primary)] bg-white text-[9px] font-bold text-[var(--text-muted)]">
                MC
              </span>
              <span className="inline-flex h-7 w-10 items-center justify-center rounded border border-[var(--border-primary)] bg-white text-[9px] font-bold text-[var(--text-muted)]">
                UPI
              </span>
              <span className="inline-flex h-7 w-10 items-center justify-center rounded border border-[var(--border-primary)] bg-white text-[9px] font-bold text-[var(--brand-green)]">
                RZP
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-black text-[var(--text-primary)]">Quick Links</h3>
            <ul className="mt-3 space-y-2">
              {[
                { label: "Shop All", href: "/" },
                { label: "Sellers", href: "/sellers" },
                { label: "Top Sellers", href: "/leaderboard" },
                { label: "AI Hub", href: "/ai" },
                { label: "Become a Seller", href: "/become-seller" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-accent)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-black text-[var(--text-primary)]">Support</h3>
            <ul className="mt-3 space-y-2">
              {[
                { label: "My Orders", href: "/orders" },
                { label: "My Wishlist", href: "/wishlist" },
                { label: "My Profile", href: "/profile" },
                { label: "Cart", href: "/cart" },
                { label: "FAQ", href: "#" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-accent)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-black text-[var(--text-primary)]">Contact</h3>
            <ul className="mt-3 space-y-3 text-xs text-[var(--text-muted)]">
              <li>
                <span className="font-bold text-[var(--text-secondary)]">Email:</span>
                <br />
                support@drmart.com
              </li>
              <li>
                <span className="font-bold text-[var(--text-secondary)]">Phone:</span>
                <br />
                +91 1800-123-4567
              </li>
              <li className="flex gap-3">
                <span className="cursor-pointer hover:text-[var(--text-accent)]">𝕏</span>
                <span className="cursor-pointer hover:text-[var(--text-accent)]">Instagram</span>
                <span className="cursor-pointer hover:text-[var(--text-accent)]">YouTube</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-[var(--border-primary)] pt-6 text-center">
          <p className="text-[11px] text-[var(--text-muted)]">
            &copy; {currentYear} DR MART by DR Group. All rights reserved.
            Crafted with care in India. 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}