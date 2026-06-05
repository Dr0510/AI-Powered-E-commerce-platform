"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { moneyFromPaise, priceInPaise } from "@/lib/format";
import { StoreHeader, StatusPill } from "@/components/StoreShell";

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
    <main className="luxury-shell min-h-screen text-[#171412]">
      <StoreHeader />
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="glass-panel rounded p-5">
          <StatusPill tone="gold">Saved collection</StatusPill>
          <h1 className="mt-3 text-3xl font-black">Wishlist</h1>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.length ? items.map((item) => (
              <article className="rounded border border-[#e3d7c7] bg-[#fffaf1] p-4 hover:-translate-y-1 hover:shadow-lg" key={item.productId}>
                <Link href={`/product/${item.productId}`}>
                  <img alt={item.title} className="h-44 w-full object-contain" src={item.image} />
                  <p className="mt-2 text-xs font-black uppercase text-[#1d6b62]">{item.category || "Curated"}</p>
                  <h2 className="mt-1 line-clamp-2 font-black">{item.title}</h2>
                </Link>
                <p className="mt-2 text-xl font-black">{moneyFromPaise(priceInPaise(item))}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="rounded bg-[#123f3a] py-2 text-sm font-black text-white" onClick={() => addToCart(item)} type="button">Cart</button>
                  <button className="rounded border border-[#c38b46] py-2 text-sm font-black text-[#6d4618]" onClick={() => remove(item)} type="button">Remove</button>
                </div>
              </article>
            )) : <p className="rounded bg-[#fffaf1] p-5 text-[#7c6a55]">No wishlist items yet.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
