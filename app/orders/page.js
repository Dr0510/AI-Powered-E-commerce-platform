"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { money, formatDate } from "@/lib/format";
import { StoreHeader, StatusPill } from "@/components/StoreShell";
import EmptyState from "@/components/EmptyState";
import { OrdersSkeleton } from "@/components/SkeletonLoaders";
import SiteFooter from "@/components/SiteFooter";
import { useToast, ToastContainer } from "@/components/Toast";

const payableStatuses = new Set(["pending", "payment_pending", "payment_failed"]);
const fulfilledStatuses = new Set(["paid", "packed", "shipped", "delivered"]);

const fulfillmentSteps = ["unfulfilled", "packed", "shipped", "delivered"];

const statusMeta = {
  pending: { label: "Pending", color: "gold", icon: "⏳" },
  payment_pending: { label: "Payment Pending", color: "gold", icon: "💳" },
  payment_failed: { label: "Payment Failed", color: "rose", icon: "❌" },
  paid: { label: "Paid", color: "green", icon: "✅" },
  cancelled: { label: "Cancelled", color: "rose", icon: "🚫" },
  unfulfilled: { label: "Processing", color: "gold", icon: "📦" },
  packed: { label: "Packed", color: "gold", icon: "📦" },
  shipped: { label: "Shipped", color: "green", icon: "🚚" },
  delivered: { label: "Delivered", color: "green", icon: "🎉" },
  default: { label: "Unknown", color: "ink", icon: "❓" },
};

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
    if (window.Razorpay) return resolve(true);
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
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, showToast, dismissToast } = useToast();

  // ── Computed ──
  const stats = useMemo(() => {
    const total = orders.length;
    const totalSpent = orders
      .filter((o) => o.status === "paid" || fulfilledStatuses.has(o.fulfillmentStatus))
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingPayments = orders.filter((o) => payableStatuses.has(o.status)).length;
    const delivered = orders.filter((o) => o.fulfillmentStatus === "delivered").length;
    return { total, totalSpent, pendingPayments, delivered };
  }, [orders]);

  async function loadOrders() {
    const nextOrders = await fetchOrders();
    setOrders(nextOrders);
    setStatus(nextOrders.length ? `${nextOrders.length} order${nextOrders.length !== 1 ? "s" : ""} found` : "No orders yet.");
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const nextOrders = await fetchOrders();
        if (active) {
          setOrders(nextOrders);
          setStatus(nextOrders.length ? `${nextOrders.length} order${nextOrders.length !== 1 ? "s" : ""} found` : "No orders yet.");
          setIsLoading(false);
        }
      } catch (error) {
        if (active) {
          setStatus(error.message);
          setIsLoading(false);
        }
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(interval);
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
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${orderId.slice(-8)}.html`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      showToast(`Receipt downloaded for order #${orderId.slice(-8)}`, "success");
      setStatus(`Receipt downloaded for order #${orderId.slice(-8)}.`);
    } catch (error) {
      console.error("Download error:", error);
      showToast("Error downloading receipt: " + error.message, "error");
      setStatus("Error downloading receipt: " + error.message);
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
      showToast(`Receipt emailed for order #${orderId.slice(-8)}`, "success");
      setStatus(`Receipt emailed for order #${orderId.slice(-8)}.`);
    } catch (error) {
      showToast("Error emailing receipt: " + error.message, "error");
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
          prefill: { name: payment.name, email: payment.email },
          notes: { localOrderId: payment.localOrderId },
          theme: { color: "#123f3a" },
          handler: async (response) => {
            try {
              await api("/api/payments/razorpay", {
                method: "PUT",
                body: JSON.stringify({ localOrderId: payment.localOrderId, ...response }),
              });
              resolve(true);
            } catch (error) {
              reject(error);
            }
          },
          modal: { ondismiss: () => resolve(false) },
        });
        checkout.open();
      });
      await loadOrders();
      if (success) {
        showToast(`Payment complete for order #${order._id.slice(-8)}`, "success");
        setStatus(`Payment complete for order #${order._id.slice(-8)}.`);
      } else {
        showToast(`Payment window closed for order #${order._id.slice(-8)}`, "warn");
        setStatus(`Order #${order._id.slice(-8)} is still waiting for payment.`);
      }
    } catch (error) {
      showToast("Payment error: " + error.message, "error");
      setStatus(error.message);
    } finally {
      setPaying(null);
    }
  };

  function getOrderMeta(order) {
    const key = order.fulfillmentStatus || order.status;
    return statusMeta[key] || statusMeta.default;
  }

  function getCurrentStep(order) {
    const status = order.fulfillmentStatus || order.status;
    const idx = fulfillmentSteps.indexOf(status);
    return idx >= 0 ? idx : -1;
  }

  return (
    <main className="luxury-shell min-h-screen text-[var(--text-primary)]">
      <StoreHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-[var(--text-primary)]">Orders & Tracking</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{status}</p>
        </div>

        {/* Stats Overview */}
        {!isLoading && orders.length > 0 && (
          <motion.div
            className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="stat-card">
              <p className="stat-number">{stats.total}</p>
              <p className="stat-label">Total Orders</p>
            </div>
            <div className="stat-card">
              <p className="stat-number">{money(stats.totalSpent)}</p>
              <p className="stat-label">Total Spent</p>
            </div>
            <div className="stat-card">
              <p className="stat-number">{stats.delivered}</p>
              <p className="stat-label">Delivered</p>
            </div>
            <div className="stat-card">
              <p className="stat-number" style={{ color: stats.pendingPayments > 0 ? "var(--badge-rose-text)" : "var(--text-accent)" }}>
                {stats.pendingPayments}
              </p>
              <p className="stat-label">Pending Payments</p>
            </div>
          </motion.div>
        )}

        {/* Orders List */}
        {isLoading ? (
          <div className="glass-panel rounded-xl p-5">
            <OrdersSkeleton />
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const meta = getOrderMeta(order);
              const currentStep = getCurrentStep(order);
              const isPayable = payableStatuses.has(order.status);
              const isFulfilled = order.status === "paid" || fulfilledStatuses.has(order.fulfillmentStatus);

              return (
                <motion.article
                  key={order._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                  className="glass-panel rounded-xl overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-primary)] bg-[var(--surface-primary)] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/orders/success/${order._id}`}
                        className="text-sm font-black text-[var(--text-primary)] hover:text-[var(--text-accent)] transition-colors"
                      >
                        Order #{order._id.slice(-8)}
                      </Link>
                      <StatusPill tone={meta.color}>{meta.icon} {meta.label}</StatusPill>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-[var(--text-primary)]">{money(order.total)}</span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  {order.items?.length > 0 && (
                    <div className="border-b border-[var(--border-primary)] bg-[var(--card-bg)] px-5 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {order.items.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {item.image && (
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-secondary)] p-1.5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt={item.title} className="h-full w-full object-contain" src={item.image} />
                              </div>
                            )}
                            <div className="min-w-0 max-w-[160px]">
                              <p className="truncate text-xs font-bold text-[var(--text-primary)]">{item.title}</p>
                              <p className="text-[10px] text-[var(--text-muted)]">x{item.quantity}</p>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <span className="text-xs font-bold text-[var(--text-muted)]">+{order.items.length - 4} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fulfillment Stepper */}
                  {currentStep >= 0 && (
                    <div className="border-b border-[var(--border-primary)] bg-[var(--card-bg)] px-5 py-4">
                      <div className="flex items-center gap-1">
                        {fulfillmentSteps.map((step, idx) => {
                          const isCompleted = idx <= currentStep;
                          const isCurrent = idx === currentStep;
                          return (
                            <div key={step} className="flex flex-1 items-center">
                              <div
                                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-black transition-all ${
                                  isCurrent
                                    ? "bg-[var(--brand-green)] text-white shadow-sm"
                                    : isCompleted
                                    ? "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]"
                                    : "bg-[var(--surface-secondary)] text-[var(--text-muted)]"
                                }`}
                              >
                                <span>{isCompleted ? "✓" : "○"}</span>
                                <span className="hidden sm:inline">{step}</span>
                              </div>
                              {idx < fulfillmentSteps.length - 1 && (
                                <div
                                  className={`mx-1 h-px flex-1 ${
                                    idx < currentStep
                                      ? "bg-[var(--brand-green)]"
                                      : "bg-[var(--border-primary)]"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Payment Pending Banner */}
                  {isPayable && (
                    <div className="border-b border-[var(--border-primary)] bg-[var(--badge-gold-bg)] px-5 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💳</span>
                          <div>
                            <p className="text-sm font-black text-[var(--badge-gold-text)]">Payment Pending</p>
                            <p className="text-xs text-[var(--badge-gold-text)]/80">Complete payment to confirm this order.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRepayment(order)}
                          disabled={paying === order._id}
                          className="btn-primary rounded-lg px-5 py-2.5 text-xs font-black disabled:opacity-50"
                          type="button"
                        >
                          {paying === order._id ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Opening...
                            </span>
                          ) : (
                            "Pay Now"
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isFulfilled && (
                    <div className="flex flex-wrap items-center gap-2 bg-[var(--surface-primary)] px-5 py-3">
                      <button
                        onClick={() => handleViewReceipt(order._id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-green)] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[var(--brand-green-bright)]"
                        type="button"
                      >
                        👁 View Receipt
                      </button>
                      <button
                        onClick={(e) => handleDownloadPDF(order._id, e)}
                        disabled={downloading === order._id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-primary)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-secondary)] disabled:opacity-50"
                        type="button"
                      >
                        {downloading === order._id ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            ⬇ Download HTML
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleEmailReceipt(order._id)}
                        disabled={emailing === order._id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-primary)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-secondary)] disabled:opacity-50"
                        type="button"
                      >
                        {emailing === order._id ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Emailing...
                          </>
                        ) : (
                          <>
                            ✉ Email Receipt
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel rounded-xl p-8">
            <EmptyState
              icon="📦"
              title="No orders yet"
              description="Start shopping to create your first order. Track all your purchases here."
              actionLabel="Start shopping"
              actionHref="/"
            />
          </div>
        )}
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <SiteFooter />
    </main>
  );
}