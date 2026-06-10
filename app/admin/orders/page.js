"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import AdminLayout from "@/components/AdminLayout";

const fulfillmentOptions = ["unfulfilled", "packed", "shipped", "delivered", "cancelled"];
const statusOptions = ["", "paid", "pending", "cancelled", "payment_pending", "payment_failed"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);
  const limit = 20;

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (fulfillmentFilter) params.set("fulfillment", fulfillmentFilter);
      const data = await api(`/api/admin/orders?${params}`);
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (e) { showToast(e.message, "error"); } finally { setLoading(false); }
  }, [currentPage, search, statusFilter, fulfillmentFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  function applyFilters(f, v) {
    if (f === "search") setSearch(v);
    else if (f === "status") setStatusFilter(v);
    else if (f === "fulfillment") setFulfillmentFilter(v);
    setCurrentPage(1);
  }

  async function updateOrder(orderId, fulfillmentStatus) {
    setBusy(true);
    try {
      const data = await api("/api/orders", { method: "PATCH", body: JSON.stringify({ orderId, fulfillmentStatus }) });
      setOrders(current => current.map(o => o._id === orderId ? { ...o, ...data.order } : o));
      showToast("Order updated");
    } catch (e) { showToast(e.message, "error"); } finally { setBusy(false); }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-black text-[var(--text-primary)]">Orders</h2><p className="text-xs text-[var(--text-muted)]">{total} total orders</p></div><button onClick={loadOrders} className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-all" type="button">🔄 Refresh</button></div>

        <div className="flex flex-wrap items-center gap-3">
          <input className="themed-input !py-2 !text-sm max-w-xs" placeholder="🔍 Search orders..." value={search} onChange={e => applyFilters("search", e.target.value)} />
          <select className="themed-select !py-2 !text-sm" value={statusFilter} onChange={e => applyFilters("status", e.target.value)}>
            <option value="">All Status</option>{statusOptions.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="themed-select !py-2 !text-sm" value={fulfillmentFilter} onChange={e => applyFilters("fulfillment", e.target.value)}>
            <option value="">All Fulfillment</option>{fulfillmentOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5"><div className="skeleton w-1/3 h-5 mb-3" /><div className="skeleton w-1/2 h-4 mb-2" /><div className="skeleton w-1/4 h-4" /></div>)}</div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] py-16 text-center"><span className="text-4xl mb-4 block">🛒</span><h3 className="font-black text-[var(--text-primary)]">No orders found</h3><p className="text-sm text-[var(--text-muted)] mt-1">Orders will appear here once customers start purchasing.</p></div>
        ) : (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] overflow-hidden">
            <div className="hidden md:grid grid-cols-[1.2fr_1fr_1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <span>Order</span><span>Customer</span><span>Total</span><span>Status</span><span>Fulfillment</span><span>Items</span>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {orders.map(o => (
                <div key={o._id} className="p-4 md:px-5 md:py-3 hover:bg-[var(--tab-hover-bg)] transition-all cursor-pointer" onClick={() => setExpandedId(expandedId === o._id ? null : o._id)}>
                  <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto_auto] gap-2 md:gap-4 items-center">
                    <div><p className="font-bold text-sm text-[var(--text-primary)]">#{String(o._id).slice(-8)}</p><p className="text-xs text-[var(--text-muted)]" suppressHydrationWarning>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ""}</p></div>
                    <div><p className="text-sm text-[var(--text-secondary)]">{o.customer?.name || "—"}</p><p className="text-xs text-[var(--text-muted)] truncate">{o.customer?.email || ""}</p></div>
                    <div><p className="font-bold text-sm text-[var(--text-primary)]">{money(o.total)}</p></div>
                    <div><span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${o.status==="paid"?"bg-emerald-500/10 text-emerald-600":o.status==="cancelled"?"bg-red-500/10 text-red-600":o.status==="payment_failed"?"bg-red-500/10 text-red-600":"bg-amber-500/10 text-amber-600"}`}>{o.status}</span></div>
                    <div className="hidden md:block"><select className="themed-select !py-1.5 !px-2 !text-[11px] !rounded-lg" disabled={busy} onClick={e => e.stopPropagation()} onChange={e => updateOrder(o._id, e.target.value)} value={o.fulfillmentStatus}>{fulfillmentOptions.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                    <div><span className="px-2 py-1 rounded-lg bg-[var(--surface-secondary)] text-xs font-bold text-[var(--text-secondary)]">{o.items?.length || 0} items</span></div>
                  </div>

                  {expandedId === o._id && (
                    <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase text-[var(--text-muted)]">Customer</h4>
                        <p className="text-sm text-[var(--text-secondary)]">{o.customer?.name || "—"}</p>
                        <p className="text-xs text-[var(--text-muted)]">{o.customer?.email || "—"}</p>
                        {o.shippingAddress && <p className="text-xs text-[var(--text-muted)]">{o.shippingAddress.line1}, {o.shippingAddress.city}</p>}
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase text-[var(--text-muted)]">Items</h4>
                        {(o.items || []).map((item, i) => <div key={item.id || `${o._id}-item-${i}`} className="flex items-center gap-2"><span className="text-xs text-[var(--text-secondary)]">{item.title} × {item.quantity}</span><span className="text-xs font-bold text-[var(--text-primary)]">{money(item.price)}</span></div>)}
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase text-[var(--text-muted)]">Actions</h4>
                        <select className="themed-select !py-2 !text-sm w-full" disabled={busy} onClick={e => e.stopPropagation()} onChange={e => updateOrder(o._id, e.target.value)} value={o.fulfillmentStatus}>{fulfillmentOptions.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}</select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {totalPages > 1 && <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-subtle)]"><p className="text-xs text-[var(--text-muted)]">Page {currentPage} of {totalPages}</p><div className="flex gap-1.5"><button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-bold disabled:opacity-30" type="button">←</button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-bold disabled:opacity-30" type="button">→</button></div></div>}
          </div>
        )}
      </div>
      {toast && <div className="fixed top-4 right-4 z-[9999] px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-lg text-sm font-bold animate-modal-enter">{toast.type==="error"?"❌":"✅"} {toast.msg}</div>}
    </AdminLayout>
  );
}