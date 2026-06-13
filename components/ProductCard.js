"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { motion } from "framer-motion";
import { money, ratingFor, discountFor } from "@/lib/format";
import { deliveryEstimate } from "@/components/StoreShell";

export default function ProductCard({
  product,
  index = 0,
  onAddToCart,
  onToggleWishlist,
  isSaved = false,
  isCartAdded = false,
  isSaving = false,
}) {
  const outOfStock = product.stock <= 0;
  const discount = discountFor(product);
  const mrp = product.price / (1 - discount / 100);
  const rating = ratingFor(product);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className="group relative flex flex-col rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--card-hover-shadow)]"
    >
      {/* Image */}
      <Link href={`/product/${product._id}`} className="relative aspect-square overflow-hidden rounded-lg bg-[var(--surface-secondary)]">
        {/* Stock badge */}
        <span
          className={`absolute left-2 top-2 z-10 rounded-full px-2.5 py-1 text-[10px] font-black ${
            outOfStock
              ? "bg-[var(--badge-rose-bg)] text-[var(--badge-rose-text)]"
              : "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]"
          }`}
        >
          {outOfStock ? "Out of Stock" : "In Stock"}
        </span>

        {/* Wishlist button — positioned top-right */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist?.(product);
          }}
          disabled={isSaving}
          className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
            isSaved
              ? "bg-[var(--badge-rose-bg)] text-[var(--badge-rose-text)] shadow-sm"
              : "bg-white/80 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--badge-rose-bg)] hover:text-[var(--badge-rose-text)]"
          }`}
          type="button"
          aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
        >
          {isSaving ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <span className={`text-base transition-transform ${isSaved ? "scale-110" : ""}`}>
              {isSaved ? "♥" : "♡"}
            </span>
          )}
        </button>

        {product.image ? (
          <img
            alt={product.title}
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
            src={product.image}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-[var(--text-muted)]">
            📦
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="mt-3 flex flex-1 flex-col gap-1.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-accent)]">
          {product.category || "General"}
        </p>

        <Link href={`/product/${product._id}`}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-black leading-tight text-[var(--text-primary)] transition-colors hover:text-[var(--text-accent)]">
            {product.title}
          </h3>
        </Link>

        {/* Rating + delivery */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs font-bold">
            <span className="text-[#f59e0b]">★</span>
            <span className="text-[var(--text-primary)]">{rating}</span>
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">{deliveryEstimate(product.stock)}</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-black text-[var(--text-primary)]">{money(product.price)}</span>
          <span className="text-xs text-[var(--text-muted)] line-through">{money(mrp)}</span>
          <span className="text-[10px] font-bold text-[var(--text-accent)]">{discount}% off</span>
        </div>

        {/* Add to Cart */}
        <button
          onClick={() => onAddToCart?.(product)}
          disabled={outOfStock}
          className={`btn-primary mt-auto w-full rounded-lg px-3 py-2.5 text-xs font-black transition-all ${
            isCartAdded ? "!bg-[var(--brand-green-bright)]" : ""
          } disabled:cursor-not-allowed disabled:opacity-50`}
          type="button"
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            {isCartAdded ? (
              <>
                <span className="text-sm">✓</span>
                Added to Cart
              </>
            ) : (
              <>
                <span className="text-sm">🛒</span>
                {outOfStock ? "Out of Stock" : "Add to Cart"}
              </>
            )}
          </span>
        </button>
      </div>
    </motion.article>
  );
}