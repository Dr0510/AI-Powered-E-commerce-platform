"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "@/lib/format";
import { StoreHeader, StatusPill } from "@/components/StoreShell";

const payableStatuses = new Set(["pending", "payment_pending", "payment_failed"]);

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

function loadRazorpayCheckout() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout"));
    document.body.appendChild(script);
  });
}

async function fetchOrders() {
  const data = await api("/api/orders");
  return data.orders;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("Loading orders...");
  const [downloading, setDownloading] = useState(null);
  const [emailing, setEmailing] = useState(null);
  const [paying, setPaying] = useState(null);

  async function loadOrders() {
    const nextOrders = await fetchOrders();
    setOrders(nextOrders);
    setStatus(nextOrders.length ? "Track every DR MART order here." : "No orders yet.");
  }

  useEffect(() => {
    let active = true;

    fetchOrders()
      .then((nextOrders) => {
        if (!active) {
          return;
        }

        setOrders(nextOrders);
        setStatus(nextOrders.length ? "Track every DR MART order here." : "No orders yet.");
      })
      .catch((error) => {
        if (active) {
          setStatus(error.message);
        }
      });

    return () => {
      active = false;
    };
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

  const handleEmailReceipt = async (orderId) => {
    setEmailing(orderId);
    setStatus(`Emailing receipt for order #${orderId.slice(-8)}...`);

    try {
      await api("/api/orders/receipt", {
        method: "POST",
        body: JSON.stringify({ orderId }),
      });
      await loadOrders();
      setStatus(`Receipt emailed for order #${orderId.slice(-8)}.`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setEmailing(null);
    }
  };

  const handleRepayment = async (order) => {
    setPaying(order._id);
    setStatus(`Opening payment for order #${order._id.slice(-8)}...`);

    try {
      const payment = await api("/api/payments/razorpay", {
        method: "POST",
        body: JSON.stringify({ orderId: order._id }),
      });

      await loadRazorpayCheckout();

      const success = await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: payment.keyId,
          amount: payment.amountInPaise,
          currency: payment.currency,
          name: "DR MART",
          description: `Order #${payment.localOrderId.slice(-6)}`,
          order_id: payment.razorpayOrderId,
          prefill: {
            name: payment.name,
            email: payment.email,
          },
          notes: {
            localOrderId: payment.localOrderId,
          },
          theme: { color: "#123f3a" },
          handler: async (response) => {
            try {
              await api("/api/payments/razorpay", {
                method: "PUT",
                body: JSON.stringify({
                  localOrderId: payment.localOrderId,
                  ...response,
                }),
              });
              resolve(true);
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => resolve(false),
          },
        });

        checkout.open();
      });

      await loadOrders();
      setStatus(
        success
          ? `Payment complete for order #${order._id.slice(-8)}.`
          : `Order #${order._id.slice(-8)} is still waiting for payment.`,
      );
    } catch (error) {
      setStatus(error.message);
    } finally {
      setPaying(null);
    }
  };

  return (
    <main className="luxury-shell min-h-screen text-[#171412]">
      <StoreHeader />
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="glass-panel rounded p-5">
          <StatusPill tone="gold">Order history</StatusPill>
          <h1 className="mt-3 text-3xl font-black">Orders & Tracking</h1>
          <p className="mt-2 text-[#7c6a55]">{status}</p>
          <div className="mt-5 space-y-4">
            {orders.map((order) => (
              <article className="rounded border border-[#e3d7c7] bg-[#fffaf1] p-4" key={order._id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-black">Order #{order._id.slice(-8)}</h2>
                    <p className="text-sm font-black uppercase text-[#1d6b62]">{order.status}</p>
                  </div>
                  <p className="text-xl font-black">{money(order.total)}</p>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-4">
                  {["pending", "paid", "packed", "shipped", "delivered"].map((step) => (
                    <div className={`rounded p-3 text-sm font-bold ${step === order.status ? "bg-[#123f3a] text-white" : "bg-[#f4efe7] text-[#7c6a55]"}`} key={step}>
                      {step}
                    </div>
                  ))}
                </div>

                {payableStatuses.has(order.status) && (
                  <div className="mt-4 rounded border border-[#c38b46] bg-[#f7e3bd] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-[#6d4618]">Payment pending</p>
                        <p className="text-sm text-[#6d4618]">Complete payment to confirm this order.</p>
                      </div>
                      <button
                        onClick={() => handleRepayment(order)}
                        disabled={paying === order._id}
                        className="rounded bg-[#123f3a] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1d6b62] disabled:cursor-not-allowed disabled:opacity-50"
                        type="button"
                      >
                        {paying === order._id ? "Opening payment..." : "Pay Now"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Receipt & PDF Actions for Paid Orders */}
                {(order.status === "paid" || order.status === "packed" || order.status === "shipped" || order.status === "delivered") && (
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleViewReceipt(order._id)}
                      className="rounded bg-[#123f3a] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1d6b62]"
                    >
                      View Receipt
                    </button>
                    <button
                      onClick={(e) => handleDownloadPDF(order._id, e)}
                      disabled={downloading === order._id}
                      className="rounded border border-[#123f3a] px-4 py-2 text-sm font-bold text-[#123f3a] transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {downloading === order._id ? "Downloading..." : "Download HTML"}
                    </button>
                    <button
                      onClick={() => handleEmailReceipt(order._id)}
                      disabled={emailing === order._id}
                      className="rounded border border-[#c38b46] px-4 py-2 text-sm font-bold text-[#6d4618] transition hover:bg-[#f7e3bd] disabled:cursor-not-allowed disabled:opacity-50"
                      type="button"
                    >
                      {emailing === order._id ? "Emailing..." : "Email Receipt"}
                    </button>
                  </div>
                )}
              </article>
            ))}
            {!orders.length ? <p className="rounded bg-[#fffaf1] p-5 text-[#7c6a55]">No orders yet.</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
