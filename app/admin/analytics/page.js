"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import AdminLayout from "@/components/AdminLayout";

function MiniChart({ data, label, color = "var(--brand-green)" }) {
  if (!data || data.length === 0) return <div className="h-32 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center text-xs text-[var(--text-muted)]">No data yet</div>;
  const max = Math.max(...data.map(d => d.value || d.count || 0), 1);
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-32">
        {data.slice(-12).map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-sm transition-all duration-300" style={{ height: `${Math.max(4, ((d.value || d.count || 0) / max) * 100)}%`, background: color, opacity: 0.7 + (i / data.length) * 0.3 }} title={`${d.label}: ${d.value || d.count || 0}`} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-bold">
        {data.slice(-12).filter((_, i, arr) => i === 0 || i === arr.length - 1).map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
      <p className="text-xs font-bold text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast({ msg }); setTimeout(() => setToast(null), 3000); };

  const loadAnalytics = useCallback(async () => {
    try {
      const result = await api("/api/admin/analytics");
      setData(result);
    } catch (e) { showToast(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAnalytics(); }, []);

  if (loading) return <AdminLayout><div className="space-y-6">{[1,2,3].map(i => <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6"><div className="skeleton w-32 h-5 mb-4" /><div className="skeleton w-full h-32" /></div>)}</div></AdminLayout>;
  if (!data) return <AdminLayout><div className="text-center py-20"><p className="text-[var(--text-muted)]">Failed to load analytics.</p></div></AdminLayout>;

  const revenueData = (data.revenueByMonth || []).map(r => ({ label: r.month, value: r.revenue }));
  const ordersData = (data.ordersByMonth || []).map(r => ({ label: r.month, value: r.total }));
  const usersData = (data.usersByMonth || []).map(r => ({ label: r.month, value: r.users }));
  const recentRev = data.recentRevenue?.[0] || {};

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-black text-[var(--text-primary)]">Analytics</h2><p className="text-xs text-[var(--text-muted)]">Real-time business insights from your database</p></div><button onClick={loadAnalytics} className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-all" type="button">🔄 Refresh</button></div>

        {/* Revenue Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          {[{ label: "Last 24 Hours", value: money((recentRev.last_1_day || 0) / 100), icon: "📅" }, { label: "Last 7 Days", value: money((recentRev.last_7_days || 0) / 100), icon: "📊" }, { label: "Last 30 Days", value: money((recentRev.last_30_days || 0) / 100), icon: "📈" }].map((s, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 flex items-center gap-4">
              <span className="text-2xl">{s.icon}</span>
              <div><p className="text-xs font-bold uppercase text-[var(--text-muted)]">{s.label}</p><p className="text-xl font-black text-[var(--text-primary)]">{s.value}</p></div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5"><MiniChart data={revenueData} label="Revenue by Month" color="#0c3b35" /></div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5"><MiniChart data={ordersData} label="Orders by Month" color="#2563eb" /></div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5"><MiniChart data={usersData} label="New Users by Month" color="#9333ea" /></div>
        </div>

        {/* Top Products */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5">
          <h3 className="text-sm font-black text-[var(--text-primary)] mb-4">🏆 Top Products by Revenue</h3>
          {data.topProducts?.length > 0 ? (
            <div className="space-y-2">
              {data.topProducts.map((p, i) => (
                <div key={p._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--tab-hover-bg)] transition-all">
                  <span className="text-xs font-black text-[var(--text-muted)] w-6">#{i + 1}</span>
                  {p.image ? <img alt="" className="w-8 h-8 rounded-lg object-contain bg-[var(--surface-secondary)]" src={p.image} /> : <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)]" />}
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-[var(--text-primary)] truncate">{p.title}</p><p className="text-[10px] text-[var(--text-muted)]">{p.category} · {p.timesSold} sold</p></div>
                  <span className="text-sm font-black text-[var(--text-primary)]">{money(p.totalRevenue)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-[var(--text-muted)]">No sales data yet.</p>}
        </div>

        {/* Top Sellers + Category Breakdown */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5">
            <h3 className="text-sm font-black text-[var(--text-primary)] mb-4">🏪 Top Sellers</h3>
            {data.topSellers?.length > 0 ? data.topSellers.map((s, i) => (
              <div key={s._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--tab-hover-bg)] transition-all">
                <span className="text-xs font-black text-[var(--text-muted)] w-6">#{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-green)]/20 to-[var(--brand-green-bright)]/20 flex items-center justify-center text-sm">🏪</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-[var(--text-primary)]">{s.shopName}</p><p className="text-[10px] text-[var(--text-muted)]">{s.productCount} products · {s.followersCount || 0} followers</p></div>
                <span className="text-sm font-black text-[var(--text-primary)]">{money(s.totalEarnings)}</span>
              </div>
            )) : <p className="text-xs text-[var(--text-muted)]">No seller data yet.</p>}
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5">
            <h3 className="text-sm font-black text-[var(--text-primary)] mb-4">📂 Category Breakdown</h3>
            {data.categoryStats?.length > 0 ? data.categoryStats.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="flex-1"><p className="text-sm font-bold text-[var(--text-primary)]">{c.category}</p><p className="text-[10px] text-[var(--text-muted)]">{c.activeCount} active · avg {money(c.avgPrice)}</p></div>
                <div className="w-20 h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden"><div className="h-full rounded-full bg-[var(--brand-green)]" style={{ width: `${Math.min(100, (c.productCount / Math.max(...data.categoryStats.map(x => x.productCount), 1)) * 100)}%` }} /></div>
                <span className="text-xs font-bold text-[var(--text-secondary)]">{c.productCount}</span>
              </div>
            )) : <p className="text-xs text-[var(--text-muted)]">No categories yet.</p>}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5">
            <h3 className="text-sm font-black text-[var(--text-primary)] mb-4">📊 Order Status</h3>
            <div className="flex flex-wrap gap-3">
              {(data.orderStatusBreakdown || []).map((s, i) => (
                <div key={i} className={`px-4 py-2.5 rounded-xl text-center flex-1 min-w-[80px] ${s.status === "paid" ? "bg-emerald-500/10" : s.status === "cancelled" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
                  <p className="text-lg font-black text-[var(--text-primary)]">{s.count}</p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{s.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5">
            <h3 className="text-sm font-black text-[var(--text-primary)] mb-4">🏪 Seller Status</h3>
            <div className="flex flex-wrap gap-3">
              {(data.sellerStats || []).map((s, i) => (
                <div key={i} className={`px-4 py-2.5 rounded-xl text-center flex-1 min-w-[80px] ${s.status === "verified" ? "bg-emerald-500/10" : s.status === "rejected" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
                  <p className="text-lg font-black text-[var(--text-primary)]">{s.count}</p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{s.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="fixed top-4 right-4 z-[9999] px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-lg text-sm font-bold animate-modal-enter">✅ {toast.msg}</div>}
    </AdminLayout>
  );
}