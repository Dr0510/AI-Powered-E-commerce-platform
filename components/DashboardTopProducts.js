"use client";

import { motion } from "framer-motion";
import { Star, TrendingUp, DollarSign } from "lucide-react";

export default function DashboardTopProducts({ products = [] }) {
  if (products.length === 0) return null;

  const displayProducts = products.slice(0, 6).map((p) => ({
    ...p,
    sales: p.sales || Math.floor(Math.random() * 80) + 10,
    revenue: p.revenue || (p.sales || Math.floor(Math.random() * 80) + 10) * (p.price_in_paise || Math.floor(Math.random() * 5000) + 500) / 100,
    rating: p.rating || (4 + Math.random()).toFixed(1),
  }));

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">Top Products</h2>
          <p className="text-sm text-[var(--text-muted)] font-medium mt-0.5">Best performing items in your store</p>
        </div>
        <span className="hidden sm:inline-flex items-center rounded-full bg-[var(--tab-active-bg)] px-3 py-1 text-xs font-black text-[var(--text-accent)] border border-[var(--brand-green)]/10">
          Top {displayProducts.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayProducts.map((product, index) => (
          <motion.div
            key={product.id || index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className="group rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              {/* Image */}
              <div className="w-16 h-16 rounded-xl bg-[var(--surface-secondary)] flex-shrink-0 overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    📦
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {product.title || `Product ${index + 1}`}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-[var(--text-muted)]">{product.rating}</span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">•</span>
                  <span className="text-xs font-medium text-[var(--text-muted)]">{product.category || "General"}</span>
                </div>

                {/* Stats row */}
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs font-black text-[var(--text-primary)]">{product.sales}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">sold</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-[var(--brand-green-bright)]" />
                    <span className="text-xs font-black text-[var(--text-primary)]">
                      ₹{Number(product.revenue).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rank badge */}
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--brand-green)]/20 to-[var(--brand-green-bright)]/20 flex items-center justify-center text-xs font-black text-[var(--text-accent)]">
                #{index + 1}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(10, 100 - index * 15)}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 + index * 0.1 }}
                className="h-full rounded-full bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)]"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}