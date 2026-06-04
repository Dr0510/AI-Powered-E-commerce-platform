"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { money } from "@/lib/format";

export default function ProductCard({ product, onAddToCart, onToggleWishlist }) {
  return (
    <div className="group rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Image Container */}
      <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
        {product.image ? (
          <img
            alt={product.title}
            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
            src={product.image}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-400">
            <span className="text-3xl">📦</span>
          </div>
        )}
        
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded font-bold">Out of Stock</span>
          </div>
        )}

        {product.stock < 5 && product.stock > 0 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 text-xs font-bold rounded">
            Only {product.stock} left
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col h-full">
        {/* Category */}
        <p className="text-xs text-slate-500 mb-1">{product.category}</p>

        {/* Title */}
        <Link href={`/product/${product._id}`}>
          <h3 className="font-bold text-sm line-clamp-2 text-slate-900 hover:text-blue-600 mb-2">
            {product.title}
          </h3>
        </Link>

        {/* Rating (placeholder) */}
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs text-yellow-500">★ 4.5</span>
          <span className="text-xs text-slate-500">(128)</span>
        </div>

        {/* Price */}
        <div className="mb-3">
          <p className="text-lg font-black text-slate-900">{money(product.price)}</p>
        </div>

        {/* Tags */}
        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onAddToCart?.(product)}
            disabled={product.stock <= 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-2 rounded text-sm transition"
          >
            🛒 Add
          </button>
          <button
            onClick={() => onToggleWishlist?.(product)}
            className="px-3 py-2 border border-slate-200 hover:border-red-500 text-slate-600 hover:text-red-500 font-bold rounded text-sm transition"
          >
            ♡
          </button>
        </div>
      </div>
    </div>
  );
}
