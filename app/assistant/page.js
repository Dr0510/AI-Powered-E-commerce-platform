"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { money } from "@/lib/format";

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

export default function AssistantPage() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("Ask for recommendations like: best gift under 5000, college laptop bag, or skincare starter kit.");
  const [products, setProducts] = useState([]);
  const [busy, setBusy] = useState(false);

  async function ask(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await api("/api/assistant", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setReply(data.reply);
      setProducts(data.products);
    } catch (error) {
      setReply(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="bg-[#131921] px-4 py-3 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/"><img alt="DR Group" className="h-10" src="/dr-group-logo.svg" /></Link>
          <nav className="flex gap-4 text-sm font-bold"><Link href="/cart">Cart</Link><Link href="/wishlist">Wishlist</Link></nav>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl gap-5 p-4 lg:grid-cols-[1fr_420px]">
        <div className="rounded bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase text-blue-700">Gemini powered</p>
          <h1 className="mt-2 text-4xl font-black">DR Shopping Assistant</h1>
          <form className="mt-5 flex gap-2" onSubmit={ask}>
            <input className="min-w-0 flex-1 rounded border border-slate-300 px-4 py-3" onChange={(event) => setMessage(event.target.value)} placeholder="What are you shopping for?" value={message} />
            <button className="rounded bg-[#ffd814] px-5 font-black disabled:opacity-50" disabled={busy} type="submit">Ask</button>
          </form>
          <div className="mt-5 whitespace-pre-wrap rounded bg-blue-50 p-5 leading-7 text-blue-950">{reply}</div>
        </div>
        <aside className="rounded bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Recommended products</h2>
          <div className="mt-4 space-y-3">
            {products.map((product) => (
              <Link className="flex gap-3 rounded border border-slate-200 p-3" href={`/product/${product._id}`} key={product._id}>
                <img alt={product.title} className="h-16 w-16 object-contain" src={product.image} />
                <div>
                  <p className="line-clamp-2 text-sm font-bold">{product.title}</p>
                  <p className="text-sm font-black">{money(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
