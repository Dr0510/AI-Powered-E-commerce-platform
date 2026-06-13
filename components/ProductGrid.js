"use client";

import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/SkeletonLoaders";
import EmptyState from "@/components/EmptyState";

export default function ProductGrid({
  products = [],
  isLoading = false,
  status = "",
  saveNotice = "",
  savedProductIds = [],
  cartAddedId = "",
  savingProductId = "",
  onAddToCart,
  onToggleWishlist,
  onSeedCatalog,
  onPriceBandChange,
  onSortChange,
  onStockToggle,
  priceBand = "all",
  sort = "featured",
  stockOnly = false,
  busy = false,
}) {
  return (
    <section className="glass-panel rounded-xl p-4 md:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border-primary)] pb-4">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">All Products</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{status}</p>
          {saveNotice && (
            <p className="mt-2 rounded-lg bg-[var(--badge-green-bg)] px-3 py-2 text-xs font-black text-[var(--badge-green-text)]">
              {saveNotice}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--badge-gold-bg)] px-3 py-1 text-[10px] font-black text-[var(--badge-gold-text)]">
            {products.length} results
          </span>
        </div>
      </div>

      {/* Filters bar */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-[var(--text-muted)]">Price:</label>
          <select
            className="themed-select rounded-lg px-3 py-2 text-xs"
            onChange={(e) => onPriceBandChange(e.target.value)}
            value={priceBand}
          >
            <option value="all">All prices</option>
            <option value="under5">Under ₹5,000</option>
            <option value="5to15">₹5k – ₹15k</option>
            <option value="above15">Above ₹15,000</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-[var(--text-muted)]">Sort:</label>
          <select
            className="themed-select rounded-lg px-3 py-2 text-xs"
            onChange={(e) => onSortChange(e.target.value)}
            value={sort}
          >
            <option value="featured">Featured</option>
            <option value="rating">Highest Rated</option>
            <option value="priceAsc">Price: Low → High</option>
            <option value="priceDesc">Price: High → Low</option>
            <option value="stock">Stock Confidence</option>
          </select>
        </div>

        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)]">
          <input
            checked={stockOnly}
            onChange={(e) => onStockToggle(e.target.checked)}
            type="checkbox"
            className="h-3.5 w-3.5 accent-[var(--brand-green)]"
          />
          In-stock only
        </label>

        <button
          onClick={onSeedCatalog}
          disabled={busy}
          className="ml-auto rounded-lg border border-[var(--border-primary)] px-3 py-2 text-[10px] font-bold text-[var(--text-muted)] transition-all hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
          type="button"
        >
          {busy ? "Loading..." : "Load demo catalog"}
        </button>
      </div>

      {/* Grid */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full">
            <ProductGridSkeleton count={8} />
          </div>
        ) : products.length > 0 ? (
          products.map((product, index) => (
            <ProductCard
              key={product._id}
              product={product}
              index={index}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              isSaved={savedProductIds.includes(product._id)}
              isCartAdded={cartAddedId === product._id}
              isSaving={savingProductId === product._id}
            />
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState
              icon="🔍"
              title="No products found"
              description="Try adjusting your search or filters to find what you're looking for."
              actionLabel="Browse all"
              actionHref="/"
            />
          </div>
        )}
      </div>
    </section>
  );
}