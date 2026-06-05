"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { money } from "@/lib/format";
import { StoreHeader, StatusPill } from "@/components/StoreShell";

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
  const [reply, setReply] = useState("Ask for refined recommendations like: best gift under 5000, college laptop bag, or skincare starter kit.");
  const [products, setProducts] = useState([]);
  const [busy, setBusy] = useState(false);

  async function ask(event) {
    event.preventDefault();
    if (!message.trim()) {
      setReply("Tell DR MART what you are shopping for.");
      return;
    }
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
    <main className="luxury-shell min-h-screen text-[#171412]">
      <StoreHeader />
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[1fr_420px]">
        <div className="glass-panel rounded p-5">
          <StatusPill tone="gold">AI concierge</StatusPill>
          <h1 className="mt-3 text-4xl font-black">DR MART Shopping Assistant</h1>
          <form className="mt-5 flex gap-2" onSubmit={ask}>
            <input className="min-w-0 flex-1 rounded border border-[#d8cbbb] px-4 py-3" onChange={(event) => setMessage(event.target.value)} placeholder="What are you shopping for?" value={message} />
            <button className="rounded bg-[#123f3a] px-5 font-black text-white disabled:opacity-50" disabled={busy} type="submit">Ask</button>
          </form>
          <div className="mt-5 whitespace-pre-wrap rounded bg-[#fffaf1] p-5 leading-7 text-[#3a322a]">{reply}</div>
        </div>
        <aside className="glass-panel rounded p-5">
          <h2 className="text-xl font-black">Recommended products</h2>
          <div className="mt-4 space-y-3">
            {products.map((product) => (
              <Link className="flex gap-3 rounded border border-[#e3d7c7] bg-[#fffaf1] p-3 hover:-translate-y-1" href={`/product/${product._id}`} key={product._id}>
                <img alt={product.title} className="h-16 w-16 object-contain" src={product.image} />
                <div>
                  <p className="line-clamp-2 text-sm font-black">{product.title}</p>
                  <p className="text-sm font-black text-[#1d6b62]">{money(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
