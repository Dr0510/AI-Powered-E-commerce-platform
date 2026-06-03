"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { moneyFromPaise, priceInPaise } from "@/lib/format";

export default function CartPage() {
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return JSON.parse(localStorage.getItem("commerce_cart") || "[]");
  });

  useEffect(() => {
    localStorage.setItem("commerce_cart", JSON.stringify(cart));
  }, [cart]);

  const totalInPaise = useMemo(() => cart.reduce((sum, item) => sum + priceInPaise(item) * item.quantity, 0), [cart]);

  function update(productId, quantity) {
    setCart((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <Header />
      <section className="mx-auto grid max-w-7xl gap-5 p-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-black">Shopping Cart</h1>
          <div className="mt-5 space-y-4">
            {cart.length ? cart.map((item) => (
              <div className="grid gap-4 border-b border-slate-200 pb-4 sm:grid-cols-[120px_1fr_auto]" key={item.productId}>
                <img alt={item.title} className="h-28 w-28 object-contain" src={item.image} />
                <div>
                  <Link className="text-lg font-bold hover:text-blue-700" href={`/product/${item.productId}`}>{item.title}</Link>
                  <p className="mt-2 text-sm text-green-700">In stock • DR Assured delivery</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button className="h-8 w-8 rounded border" onClick={() => update(item.productId, item.quantity - 1)} type="button">-</button>
                    <span className="font-bold">{item.quantity}</span>
                    <button className="h-8 w-8 rounded border" onClick={() => update(item.productId, item.quantity + 1)} type="button">+</button>
                  </div>
                </div>
                <p className="text-xl font-black">{moneyFromPaise(priceInPaise(item) * item.quantity)}</p>
              </div>
            )) : <p className="rounded bg-slate-50 p-5">Your cart is empty.</p>}
          </div>
        </div>
        <aside className="rounded bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Subtotal</h2>
          <p className="mt-2 text-3xl font-black">{moneyFromPaise(totalInPaise)}</p>
          <Link className="mt-5 block rounded bg-[#ffd814] px-4 py-3 text-center font-black" href="/">
            Continue Shopping
          </Link>
        </aside>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="bg-[#131921] px-4 py-3 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/"><img alt="DR Group" className="h-10" src="/dr-group-logo.svg" /></Link>
        <nav className="flex gap-4 text-sm font-bold">
          <Link href="/wishlist">Wishlist</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/assistant">AI Assistant</Link>
        </nav>
      </div>
    </header>
  );
}
