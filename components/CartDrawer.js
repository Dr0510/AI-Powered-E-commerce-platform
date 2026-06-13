"use client";

/* eslint-disable @next/next/no-img-element */
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { money, priceInPaise, moneyFromPaise } from "@/lib/format";

export default function CartDrawer({ open, onClose, cart = [], cartTotal = 0, cartCount = 0, user = null, onUpdateCart }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[var(--surface-primary)] shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-[var(--text-primary)]">Your Cart</h2>
                <p className="text-xs text-[var(--text-muted)]">{cartCount} item{cartCount !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-primary)] text-sm text-[var(--text-muted)] transition-all hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                type="button"
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-5xl">🛒</span>
                  <h3 className="mt-4 text-base font-black text-[var(--text-primary)]">Your cart is empty</h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Add some products to get started!</p>
                  <button
                    onClick={onClose}
                    className="btn-primary mt-6 rounded-lg px-6 py-2.5 text-xs font-black"
                    type="button"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-3"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-secondary)] p-2">
                        <img
                          alt={item.title}
                          className="h-full w-full object-contain"
                          src={item.image}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[var(--text-primary)]">{item.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">{moneyFromPaise(priceInPaise(item))}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => onUpdateCart?.(item.productId, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-primary)] text-xs font-bold text-[var(--text-secondary)] transition-colors hover:bg-[var(--brand-green)] hover:text-white"
                            type="button"
                          >
                            –
                          </button>
                          <span className="min-w-[24px] text-center text-sm font-black text-[var(--text-primary)]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              if (item.quantity < item.stock) {
                                onUpdateCart?.(item.productId, item.quantity + 1);
                              }
                            }}
                            disabled={item.quantity >= item.stock}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-primary)] text-xs font-bold text-[var(--text-secondary)] transition-colors hover:bg-[var(--brand-green)] hover:text-white disabled:opacity-30"
                            type="button"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => onUpdateCart?.(item.productId, 0)}
                        className="self-start text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--badge-rose-text)]"
                        type="button"
                        aria-label="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-[var(--border-primary)] px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Total</span>
                  <span className="text-xl font-black text-[var(--text-primary)]">{moneyFromPaise(cartTotal)}</span>
                </div>
                <Link
                  href={user ? "/checkout" : "/profile"}
                  className="btn-primary mt-3 flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-black"
                >
                  {user ? "Proceed to Checkout" : "Sign in to Checkout"}
                </Link>
                <button
                  onClick={onClose}
                  className="mt-2 w-full rounded-lg px-4 py-2.5 text-xs font-bold text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                  type="button"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}