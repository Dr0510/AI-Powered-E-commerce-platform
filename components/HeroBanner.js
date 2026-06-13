"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { useMemo } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
  }),
};

export default function HeroBanner({ categories = [], onCategorySelect, onSearch, query, onQueryChange, visibleProducts = [] }) {
  // Pick 4 random products for the hero visual grid
  const heroProducts = useMemo(() => {
    const shuffled = [...visibleProducts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }, [visibleProducts]);

  return (
    <motion.div
      className="brand-gradient overflow-hidden rounded-xl text-white shadow-xl md:rounded-2xl"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_380px] lg:items-center">
        {/* Left: Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.span
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#f4d7a1]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#f4d7a1] animate-pulse" />
            Independent Premium Marketplace
          </motion.span>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-5xl lg:text-6xl"
          >
            Curated everyday luxury, delivered with{" "}
            <span className="text-[#f4d7a1]">quiet confidence</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-4 max-w-xl text-base leading-relaxed text-[#f6efe4]/90"
          >
            DR MART brings refined products, verified sellers, intelligent discovery,
            secure Razorpay checkout, and transparent order tracking — all in one
            calm shopping experience.
          </motion.p>

          <motion.form
            variants={fadeUp}
            custom={3}
            className="mt-6 grid gap-2 rounded-xl bg-white/10 p-2 backdrop-blur-sm md:grid-cols-[140px_1fr_auto]"
            onSubmit={onSearch}
          >
            <select
              className="rounded-lg border-0 bg-white/90 px-3 py-3 text-sm font-bold text-[#123f3a] outline-none"
              onChange={(e) => onCategorySelect(e.target.value)}
              value=""
            >
              <option value="">All</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <input
              className="rounded-lg border-0 bg-white/90 px-4 py-3 text-sm text-[#171412] outline-none placeholder:text-[#7c6a55]"
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search handcrafted bags, phones, appliances..."
              value={query}
            />
            <button
              className="btn-gold cursor-pointer rounded-lg px-6 py-3 text-sm font-black disabled:opacity-60"
              type="submit"
            >
              Search
            </button>
          </motion.form>

          {/* Trust badges */}
          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-6 flex flex-wrap items-center gap-4 text-xs font-bold text-[#f6efe4]/80"
          >
            <span className="flex items-center gap-1.5">
              <span className="text-[#f4d7a1]">✓</span> Verified Sellers
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#f4d7a1]">✓</span> Razorpay Secure
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#f4d7a1]">✓</span> Order Tracking
            </span>
          </motion.div>
        </motion.div>

        {/* Right: Visual Product Grid */}
        <motion.div
          className="hidden lg:block"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {heroProducts.length === 4 ? (
            <div className="grid grid-cols-2 gap-3">
              {heroProducts.map((product, i) => (
                <motion.div
                  key={product._id}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <img
                    alt={product.title}
                    className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                    src={product.image}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
                    <p className="truncate text-xs font-bold">{product.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-xl bg-white/10 p-8 text-center">
              <div>
                <p className="text-4xl">✨</p>
                <p className="mt-3 text-sm font-bold text-[#f4d7a1]">Curated Collection</p>
                <p className="mt-1 text-xs text-[#f6efe4]/70">Load the demo catalog to see products here</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}