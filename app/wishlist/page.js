"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { moneyFromPaise, priceInPaise } from "@/lib/format";

export default function WishlistPage() {
  const [items] = useState(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return JSON.parse(localStorage.getItem("dr_wishlist") || "[]");
  });

  function addToCart(item) {
    const cart = JSON.parse(localStorage.getItem("commerce_cart") || "[]");
    localStorage.setItem("commerce_cart", JSON.stringify([
      {
        productId: item.productId,
        title: item.title,
        price: item.price,
        priceInPaise: priceInPaise(item),
        image: item.image,
        quantity: 1,
      },
      ...cart.filter((entry) => entry.productId !== item.productId),
    ]));
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <Header />
      <section className="mx-auto max-w-7xl p-4">
        <div className="rounded bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-black">Your Wishlist</h1>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.length ? items.map((item) => (
              <article className="rounded border border-slate-200 p-4" key={item.productId}>
                <Link href={`/product/${item.productId}`}>
                  <img alt={item.title} className="h-44 w-full object-contain" src={item.image} />
                  <h2 className="mt-3 line-clamp-2 font-bold">{item.title}</h2>
                </Link>
                <p className="mt-2 text-xl font-black">{moneyFromPaise(priceInPaise(item))}</p>
                <button className="mt-3 w-full rounded bg-[#ffd814] py-2 font-black" onClick={() => addToCart(item)} type="button">
                  Move to Cart
                </button>
              </article>
            )) : <p className="text-slate-500">No wishlist items yet.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="bg-[#131921] px-4 py-3 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/"><img alt="DR Group" className="h-10" src="/dr-group-logo.svg" /></Link>
        <nav className="flex gap-4 text-sm font-bold"><Link href="/cart">Cart</Link><Link href="/orders">Orders</Link></nav>
      </div>
    </header>
  );
}
