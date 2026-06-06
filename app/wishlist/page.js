"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { moneyFromPaise, priceInPaise } from "@/lib/format";
import { StoreHeader, StatusPill } from "@/components/StoreShell";
import EmptyState from "@/components/EmptyState";

export default function WishlistPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(JSON.parse(localStorage.getItem("dr_wishlist") || "[]"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function addToCart(item) {
    const cart = JSON.parse(localStorage.getItem("commerce_cart") || "[]");
    localStorage.setItem("commerce_cart", JSON.stringify([{ ...item, quantity: 1 }, ...cart.filter((entry) => entry.productId !== item.productId)]));
  }

  function remove(item) {
    const next = items.filter((entry) => entry.productId !== item.productId);
    setItems(next);
    localStorage.setItem("dr_wishlist", JSON.stringify(next));
  }

  return (
    <main className="luxury-shell min-h-screen text-[var(--text-primary)]">
      <StoreHeader />
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="glass-panel rounded p-5">
          <StatusPill tone="gold">Saved collection</StatusPill>
          <h1 className="mt-3 text-3xl font-black">Wishlist</h1>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.length ? items.map((item) => (
              <article className="rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between" key={item.productId}>
                <Link href={`/product/${item.productId}`} className="flex-1 flex flex-col">
                  <div className="h-44 w-full overflow-hidden rounded bg-[var(--surface-secondary)] p-2 flex items-center justify-center mb-2">
                    <img alt={item.title} className="h-full w-full object-contain" src={item.image} />
                  </div>
                  <p className="mt-1 text-xs font-black uppercase text-[var(--text-accent)]">{item.category || "Curated"}</p>
                  <h2 className="mt-1 line-clamp-2 font-black flex-1">{item.title}</h2>
                </Link>
                <div>
                  <p className="mt-2 text-xl font-black">{moneyFromPaise(priceInPaise(item))}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button className="rounded bg-[#123f3a] py-2 text-sm font-black text-white" onClick={() => addToCart(item)} type="button">Cart</button>
                    <button className="rounded border border-[var(--border-primary)] py-2 text-sm font-black text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]" onClick={() => remove(item)} type="button">Remove</button>
                  </div>
                </div>
              </article>
            )) : <EmptyState icon="♥" title="Wishlist is empty" description="Start saving your favorite products to build your personalized collection." actionLabel="Browse products" actionHref="/" />}
          </div>
        </div>
      </section>
    </main>
  );
}
