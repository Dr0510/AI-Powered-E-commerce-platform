"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast, ToastContainer } from "@/components/Toast";

const statusColors = {
  unfulfilled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  packed: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();

  async function loadOrders() {
    try {
      const data = await api("/api/sellers/orders");
      setOrders(data.orders);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOrders(); }, []);

  async function updateStatus(orderId, fulfillmentStatus) {
    setBusy(true);
    try {
      await api("/api/sellers/orders", { method: "PATCH", body: JSON.stringify({ orderId, fulfillmentStatus }) });
      showToast("Order updated", "success");
      await loadOrders();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--brand-green)] border-t-transparent mx-auto" />
        <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">Loading orders...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--brand-green)] text-white px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/seller/dashboard" className="text-xs font-bold opacity-80 hover:opacity-100">← Dashboard</Link>
          <h1 className="text-xl font-black mt-1">Orders</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No orders yet</h3>
            <p>Orders will appear here when customers buy your products.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <div key={order.id} className="glass-panel rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-black text-[var(--text-primary)]">Order #{String(order.id).slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-[var(--text-muted)]">{order.customer_name || "Customer"} · {order.customer_email}</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg text-[var(--text-primary)]">₹{(order.total_in_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[order.fulfillment_status] || "bg-gray-100 text-gray-700"}`}>
                      {order.fulfillment_status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-[var(--surface-secondary)] rounded-lg p-3">
                      {item.image && <img src={item.image} alt="" className="h-10 w-10 rounded object-contain bg-[var(--card-bg)]" />}
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{item.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">Qty: {item.quantity} × ₹{(item.price_in_paise / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={order.fulfillment_status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    disabled={busy || order.fulfillment_status === "cancelled" || order.fulfillment_status === "delivered"}
                    className="rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2 text-sm font-bold text-[var(--text-primary)]"
                  >
                    <option value="unfulfilled">Unfulfilled</option>
                    <option value="packed">Packed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {order.shipping_name && (
                    <span className="text-xs text-[var(--text-muted)]">Ship to: {order.shipping_name}, {order.shipping_city}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}