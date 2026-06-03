"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "@/lib/format";

async function api(path) {
  const response = await fetch(path);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("Loading orders...");
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    api("/api/orders")
      .then((data) => {
        setOrders(data.orders);
        setStatus(data.orders.length ? "Track every DR Mart order here." : "No orders yet.");
      })
      .catch((error) => setStatus(error.message));
  }, []);

  const handleDownloadPDF = async (orderId, e) => {
    e.preventDefault();
    setDownloading(orderId);
    try {
      const response = await fetch(`/api/orders/receipt?orderId=${orderId}&format=html`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to download");
      }

      const html = await response.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and click it
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${orderId.slice(-8)}.html`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      
    } catch (error) {
      console.error("Download error:", error);
      alert("Error downloading receipt: " + error.message);
    } finally {
      setDownloading(null);
    }
  };

  const handleViewReceipt = (orderId) => {
    window.open(`/api/orders/receipt?orderId=${orderId}&format=view`, "_blank");
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <Header />
      <section className="mx-auto max-w-7xl p-4">
        <div className="rounded bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-black">Orders & Tracking</h1>
          <p className="mt-2 text-slate-500">{status}</p>
          <div className="mt-5 space-y-4">
            {orders.map((order) => (
              <article className="rounded border border-slate-200 p-4" key={order._id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-black">Order #{order._id.slice(-8)}</h2>
                    <p className="text-sm uppercase text-green-700">{order.status}</p>
                  </div>
                  <p className="text-xl font-black">{money(order.total)}</p>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-4">
                  {["pending", "paid", "packed", "shipped", "delivered"].map((step) => (
                    <div className={`rounded p-3 text-sm font-bold ${step === order.status ? "bg-blue-100 text-blue-900" : "bg-slate-50"}`} key={step}>
                      {step}
                    </div>
                  ))}
                </div>

                {/* Receipt & PDF Actions for Paid Orders */}
                {(order.status === "paid" || order.status === "packed" || order.status === "shipped" || order.status === "delivered") && (
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleViewReceipt(order._id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold transition"
                    >
                      📄 View Receipt
                    </button>
                    <button
                      onClick={(e) => handleDownloadPDF(order._id, e)}
                      disabled={downloading === order._id}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloading === order._id ? "⏳ Downloading..." : "⬇️ Download HTML"}
                    </button>
                  </div>
                )}
              </article>
            ))}
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
        <Link className="font-black" href="/">DR Mart</Link>
        <nav className="flex gap-4 text-sm font-bold"><Link href="/cart">Cart</Link><Link href="/wishlist">Wishlist</Link></nav>
      </div>
    </header>
  );
}
