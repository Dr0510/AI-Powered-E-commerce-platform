"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import AdminLayout from "@/components/AdminLayout";

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const loadSellers = useCallback(async () => {
    try {
      const data = await api("/api/admin/sellers");
      setSellers(data.sellers || []);
    } catch (e) { showToast(e.message, "error"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSellers(); }, []);

  async function updateSeller(sellerId, updates) {
    setBusy(true);
    try {
      await api("/api/admin/sellers", { method: "PATCH", body: JSON.stringify({ sellerId, ...updates }) });
      showToast("Seller updated");
      await loadSellers();
    } catch (e) { showToast(e.message, "error"); } finally { setBusy(false); setConfirmAction(null); }
  }

  const filtered = sellers.filter(s => {
    if (filter !== "all" && s.verification_status !== filter) return false;
    if (search) { const q = search.toLowerCase(); if (!s.shop_name?.toLowerCase().includes(q) && !s.owner_email?.toLowerCase().includes(q) && !s.owner_name?.toLowerCase().includes(q)) return false; }
    return true;
  });

  const pendingCount = sellers.filter(s => s.verification_status === "pending").length;
  const verifiedCount = sellers.filter(s => s.verification_status === "verified").length;
  const rejectedCount = sellers.filter(s => s.verification_status === "rejected").length;

  if (loading) return <AdminLayout><div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5"><div className="skeleton w-1/3 h-5 mb-3" /><div className="skeleton w-1/2 h-4" /></div>)}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-black text-[var(--text-primary)]">Sellers</h2><p className="text-xs text-[var(--text-muted)]">{sellers.length} total · {pendingCount} pending</p></div><button onClick={loadSellers} className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-all" type="button">🔄 Refresh</button></div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-3 md:grid-cols-4">
          {[{ k: "all", l: "All", v: sellers.length, c: "bg-[var(--surface-secondary)] text-[var(--text-primary)]" }, { k: "pending", l: "Pending", v: pendingCount, c: "bg-amber-500/10 text-amber-600" }, { k: "verified", l: "Verified", v: verifiedCount, c: "bg-emerald-500/10 text-emerald-600" }, { k: "rejected", l: "Rejected", v: rejectedCount, c: "bg-red-500/10 text-red-600" }].map(s => (
            <button key={s.k} onClick={() => setFilter(s.k)} className={`p-3 rounded-xl text-center transition-all ${filter === s.k ? s.c + " ring-2 ring-current/20" : "bg-[var(--surface-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--tab-hover-bg)]"}`} type="button">
              <p className="text-xl font-black">{s.v}</p><p className="text-[10px] font-bold uppercase">{s.l}</p>
            </button>
          ))}
        </div>

        <input className="themed-input !py-2 !text-sm max-w-xs" placeholder="🔍 Search sellers..." value={search} onChange={e => setSearch(e.target.value)} />

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] py-16 text-center"><span className="text-4xl mb-4 block">🏪</span><h3 className="font-black text-[var(--text-primary)]">No sellers found</h3><p className="text-sm text-[var(--text-muted)] mt-1">{filter === "pending" ? "No pending seller applications." : "Sellers will appear here once they register."}</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(s => (
              <div key={s.id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 hover:shadow-md transition-all" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-green)]/20 to-[var(--brand-green-bright)]/20 flex items-center justify-center text-lg flex-shrink-0">🏪</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-sm text-[var(--text-primary)]">{s.shop_name}</p>
                        {s.verification_badge && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 text-[10px] font-bold">✓ Verified</span>}
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${s.verification_status === "verified" ? "bg-emerald-500/10 text-emerald-600" : s.verification_status === "rejected" ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600"}`}>{s.verification_status}</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.owner_name} · {s.owner_email}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-[var(--text-muted)]">
                        <span>📦 {s.product_count || 0} products</span>
                        <span>⭐ {s.review_count || 0} reviews</span>
                        <span>💰 {money(Number(s.total_earnings || 0))}</span>
                        <span>👥 {s.followers_count || 0} followers</span>
                        <span>📋 {s.subscription_plan || "basic"}</span>
                        <span>💹 {s.commission_rate || 10}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {s.verification_status === "pending" && (
                      <div className="flex gap-1.5">
                        <button disabled={busy} onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: s.id, action: "verified" }); }} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all" type="button">✓ Approve</button>
                        <button disabled={busy} onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: s.id, action: "rejected" }); }} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 disabled:opacity-50 transition-all" type="button">✕ Reject</button>
                      </div>
                    )}
                    <select value={s.subscription_plan || "basic"} onChange={(e) => { e.stopPropagation(); updateSeller(s.id, { subscriptionPlan: e.target.value }); }} disabled={busy} className="themed-select !py-1.5 !px-2 !text-[11px] !rounded-lg !w-20" onClick={e => e.stopPropagation()}>
                      <option value="basic">Basic</option><option value="pro">Pro</option>
                    </select>
                    <input type="number" defaultValue={s.commission_rate} onBlur={(e) => { e.stopPropagation(); const v = parseFloat(e.target.value); if (v >= 0 && v <= 100) updateSeller(s.id, { commissionRate: v }); }} className="w-14 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-2 py-1.5 text-[11px] font-bold text-[var(--text-primary)]" placeholder="%" min="0" max="100" step="0.1" onClick={e => e.stopPropagation()} />
                  </div>
                </div>

                {confirmAction && confirmAction.id === s.id && (
                  <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="text-xs text-[var(--text-secondary)]">{confirmAction.action === "verified" ? "Approve this seller?" : "Reject this seller?"}</span>
                    <button onClick={(e) => { e.stopPropagation(); updateSeller(s.id, { verificationStatus: confirmAction.action }); }} className="px-3 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 transition-all" type="button">Confirm</button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmAction(null); }} className="px-3 py-1 rounded-lg border border-[var(--border-primary)] text-[11px] font-bold text-[var(--text-muted)] transition-all" type="button">Cancel</button>
                  </div>
                )}

                {expandedId === s.id && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Email</p><p className="text-xs text-[var(--text-secondary)]">{s.owner_email || "—"}</p></div>
                    <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Phone</p><p className="text-xs text-[var(--text-secondary)]">{s.phone || "—"}</p></div>
                    <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Performance</p><p className="text-xs font-bold text-[var(--text-primary)]">{Number(s.performance_score || 0).toFixed(1)}</p></div>
                    <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Commission</p><p className="text-xs font-bold text-[var(--text-primary)]">{s.commission_rate || 10}%</p></div>
                    <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Plan</p><p className="text-xs font-bold text-[var(--text-primary)] capitalize">{s.subscription_plan || "basic"}</p></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <div className="fixed top-4 right-4 z-[9999] px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-lg text-sm font-bold animate-modal-enter">{toast.type==="error"?"❌":"✅"} {toast.msg}</div>}
    </AdminLayout>
  );
}