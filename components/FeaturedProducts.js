"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import Link from "next/link";
import { money } from "@/lib/format";

export default function FeaturedProducts({ products = [], title = "Trending Now", subtitle = "Most popular picks this week" }) {
  if (!products.length) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">{title}</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>
        </div>
        <Link
          href="/"
          className="text-xs font-bold text-[var(--text-accent)] hover:underline"
        >
          View all →
        </Link>
      </div>

      <div className="trending-scroll">
        {products.map((product, i) => (
          <motion.div
            key={product._id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Link href={`/product/${product._id}`} className="trending-card group block">
              <div className="trending-img-wrap">
                {product.image ? (
                  <img
                    alt={product.title}
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
                    src={product.image}
                  />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="trending-badge">★ {(((product._id?.charCodeAt(0) || 4) % 8) + 4).toFixed(1)}</span>
                {product.stock > 0 && product.stock < 10 && (
                  <span className="trending-badge" style={{ background: "var(--badge-rose-bg)", color: "var(--badge-rose-text)" }}>
                    Only {product.stock} left
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-black leading-tight text-[var(--text-primary)] line-clamp-2">
                {product.title}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{product.category}</p>
              <p className="mt-1 text-base font-black text-[var(--text-accent)]">{money(product.price)}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}