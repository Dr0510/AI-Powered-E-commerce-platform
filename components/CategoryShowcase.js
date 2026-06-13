"use client";

import { motion } from "framer-motion";

const categoryMeta = {
  Mobiles: { emoji: "📱", desc: "Smartphones & accessories" },
  Fashion: { emoji: "👗", desc: "Clothing, accessories & more" },
  Electronics: { emoji: "💻", desc: "Laptops, gadgets & gear" },
  Home: { emoji: "🏠", desc: "Decor, kitchen & living" },
  Footwear: { emoji: "👟", desc: "Shoes, sneakers & sandals" },
  Appliances: { emoji: "🔌", desc: "Kitchen & home appliances" },
  Beauty: { emoji: "💄", desc: "Skincare, makeup & wellness" },
  Toys: { emoji: "🧸", desc: "Games, puzzles & fun" },
  Accessories: { emoji: "⌚", desc: "Watches, bags & more" },
  default: { emoji: "📦", desc: "Browse collection" },
};

export default function CategoryShowcase({ categories = [], onSelect, activeCategory = "" }) {
  if (!categories.length) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-[var(--text-primary)]">Shop by Category</h2>
        <button
          onClick={() => onSelect("")}
          className={`text-xs font-bold transition-colors ${
            !activeCategory
              ? "text-[var(--text-accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
          type="button"
        >
          View all
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {categories.map((cat, i) => {
          const meta = categoryMeta[cat] || categoryMeta.default;
          const isActive = activeCategory === cat;

          return (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              onClick={() => onSelect(isActive ? "" : cat)}
              className={`group flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all duration-200 ${
                isActive
                  ? "bg-[var(--brand-green)] text-white shadow-lg shadow-[var(--brand-green)]/20"
                  : "glass-panel hover:-translate-y-1 hover:shadow-md"
              }`}
              type="button"
            >
              <span className={`text-2xl transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                {meta.emoji}
              </span>
              <span className={`text-xs font-bold leading-tight ${isActive ? "text-white" : "text-[var(--text-primary)]"}`}>
                {cat}
              </span>
              <span className={`text-[10px] leading-tight ${isActive ? "text-white/70" : "text-[var(--text-muted)]"}`}>
                {meta.desc}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}