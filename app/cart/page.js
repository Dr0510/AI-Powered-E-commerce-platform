"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { moneyFromPaise, priceInPaise } from "@/lib/format";
import { StoreHeader, StatusPill, deliveryEstimate } from "@/components/StoreShell";
import { useToast, ToastContainer } from "@/components/Toast";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [mounted, setMounted] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCart(JSON.parse(localStorage.getItem("commerce_cart") || "[]"));
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("commerce_cart", JSON.stringify(cart));
    }
  }, [cart, mounted]);

  const totalInPaise = useMemo(() => cart.reduce((sum, item) => sum + priceInPaise(item) * item.quantity, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  function update(productId, quantity) {
    const item = cart.find(i => i.productId === productId);
    if (quantity === 0) {
      showToast("Item removed from cart", "info");
    } else if (quantity > (item?.quantity || 0)) {
      showToast("✓ Quantity increased", "success");
    } else if (quantity < (item?.quantity || 0)) {
      showToast("✓ Quantity decreased", "info");
    }
    setCart((current) => current.map((item) => (item.productId === productId ? { ...item, quantity } : item)).filter((item) => item.quantity > 0));
  }

  return (
    <main className="luxury-shell min-h-screen text-[var(--text-primary)]">
      <StoreHeader cartCount={itemCount} />
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[1fr_360px]">
        <div className="glass-panel rounded p-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border-primary)] pb-4">
            <div>
              <StatusPill tone="gold">Secure cart</StatusPill>
              <h1 className="mt-3 text-3xl font-black">Shopping Cart</h1>
            </div>
            <p className="text-sm font-bold text-[var(--text-muted)]">{itemCount} items</p>
          </div>
          <div className="mt-5 space-y-4">
            {cart.length ? cart.map((item) => (
              <div className="grid gap-4 rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4 sm:grid-cols-[120px_1fr_auto]" key={item.productId}>
                <div className="h-28 w-28 overflow-hidden rounded bg-[var(--surface-secondary)] p-2 flex items-center justify-center">
                  <img alt={item.title} className="h-full w-full object-contain" src={item.image} />
                </div>
                <div>
                  <Link className="text-lg font-black hover:text-[var(--text-accent)]" href={`/product/${item.productId}`}>{item.title}</Link>
                  <p className="mt-2 text-sm font-bold text-[var(--text-accent)]">{deliveryEstimate(12)} · Verified seller</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button className="h-8 w-8 rounded border border-[var(--border-secondary)]" onClick={() => update(item.productId, item.quantity - 1)} type="button">-</button>
                    <span className="min-w-8 text-center font-black">{item.quantity}</span>
                    <button className="h-8 w-8 rounded border border-[var(--border-secondary)]" onClick={() => update(item.productId, item.quantity + 1)} type="button">+</button>
                  </div>
                </div>
                <p className="text-xl font-black">{moneyFromPaise(priceInPaise(item) * item.quantity)}</p>
              </div>
            )) : <p className="rounded bg-[var(--surface-primary)] border border-[var(--border-primary)] p-5 text-[var(--text-muted)]">Your cart is empty.</p>}
          </div>
        </div>
        <aside className="glass-panel rounded p-5">
          <h2 className="text-xl font-black">Order Summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><strong>{moneyFromPaise(totalInPaise)}</strong></div>
            <div className="flex justify-between"><span>Delivery</span><strong>Calculated at checkout</strong></div>
            <div className="border-t border-[var(--border-primary)] pt-3 text-lg font-black flex justify-between"><span>Total</span><span>{moneyFromPaise(totalInPaise)}</span></div>
          </div>
          <Link className="mt-5 block rounded bg-[#123f3a] px-4 py-3 text-center font-black text-white" href="/checkout">
            Continue to checkout
          </Link>
          <Link className="mt-3 block rounded border border-[var(--border-primary)] px-4 py-3 text-center font-black text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]" href="/">
            Continue Shopping
          </Link>
        </aside>
      </section>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
