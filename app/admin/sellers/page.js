"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import AdminLayout from "@/components/AdminLayout";

const filters = [
  { key: "all", label: "All sellers" },
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
];

const statusMeta = {
  pending: {
    label: "Pending",
    icon: "•",
    className: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  },
  verified: {
    label: "Verified",
    icon: "✓",
    className: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    icon: "!",
    className: "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400",
  },
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function StatusBadge({ status, verified }) {
  const meta = statusMeta[status] || statusMeta.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ring-inset ${meta.className}`}>
      <span>{verified || status === "verified" ? "✓" : meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}

function MetricCard({ label, value, tone = "default" }) {
  const toneClass = {
    default: "from-[var(--surface-elevated)] to-[var(--surface-secondary)]",
    pending: "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400",
    verified: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    rejected: "from-red-500/10 to-red-500/5 border-red-500/20 text-red-600 dark:text-red-400",
  };

  return (
    <div className={`rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-br p-4 ${toneClass[tone] || toneClass.default}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className={`mt-1 text-2xl font-black ${toneClass[tone] ? "" : "text-[var(--text-primary)]"}`}>{formatNumber(value)}</p>
    </div>
  );
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const loadSellers = useCallback(async () => {
    try {
      const data = await api("/api/admin/sellers");
      setSellers(data.sellers || []);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadSellers(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSellers]);

  const counts = useMemo(() => ({
    all: sellers.length,
    pending: sellers.filter((seller) => seller.verification_status === "pending").length,
    verified: sellers.filter((seller) => seller.verification_status === "verified").length,
    rejected: sellers.filter((seller) => seller.verification_status === "rejected").length,
  }), [sellers]);

  const filteredSellers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sellers.filter((seller) => {
      if (filter !== "all" && seller.verification_status !== filter) return false;
      if (!query) return true;
      return [
        seller.shop_name,
        seller.owner_email,
        seller.owner_name,
        seller.phone,
        seller.city,
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [sellers, filter, search]);

  async function updateSeller(sellerId, updates) {
    const previousSeller = sellers.find((seller) => seller.id === sellerId);
    setBusy(true);

    try {
      setSellers((current) => current.map((seller) => (
        seller.id === sellerId
          ? { ...seller, ...updates, updated_at: new Date().toISOString() }
          : seller
      )));

      const data = await api("/api/admin/sellers", {
        method: "PATCH",
        body: JSON.stringify({ sellerId, ...updates }),
      });

      setSellers((current) => current.map((seller) => (
        seller.id === sellerId
          ? { ...seller, ...data.seller, owner_name: seller.owner_name, owner_email: seller.owner_email }
          : seller
      )));
      showToast("Seller updated");
    } catch (error) {
      setSellers((current) => current.map((seller) => (
        seller.id === sellerId && previousSeller ? previousSeller : seller
      )));
      showToast(error.message, "error");
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5">
              <div className="skeleton h-5 w-1/3 mb-4" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <section className="overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--surface-elevated)] via-[var(--surface-elevated)] to-[var(--brand-green)]/10 p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[var(--brand-green-bright)]">Marketplace sellers</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--text-primary)]">Seller management</h2>
              <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">Approve applications, monitor performance, and control commissions from one optimized view.</p>
            </div>
            <button onClick={loadSellers} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] px-4 py-2.5 text-xs font-black text-[var(--text-secondary)] transition-all hover:bg-[var(--tab-hover-bg)] disabled:opacity-50" type="button">
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard label="Total" value={counts.all} />
            <MetricCard label="Pending" value={counts.pending} tone="pending" />
            <MetricCard label="Verified" value={counts.verified} tone="verified" />
            <MetricCard label="Rejected" value={counts.rejected} tone="rejected" />
          </div>
        </section>

        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                  filter === item.key
                    ? "bg-[var(--brand-green)] text-white shadow-lg shadow-[var(--brand-green)]/15"
                    : "border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--tab-hover-bg)] hover:text-[var(--text-primary)]"
                }`}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              className="themed-input !py-2.5 !text-sm min-w-[220px] max-w-xs"
              placeholder="Search by seller, owner, phone, city..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-xs font-black text-[var(--text-muted)] transition-all hover:text-[var(--text-primary)] hover:bg-[var(--tab-hover-bg)]" type="button">
                Clear
              </button>
            )}
          </div>
        </section>

        {filteredSellers.length === 0 ? (
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] py-16 text-center">
            <span className="mb-4 block text-4xl">🏪</span>
            <h3 className="font-black text-[var(--text-primary)]">No sellers found</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{filter === "pending" ? "No pending seller applications." : "Sellers will appear here once they register."}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredSellers.map((seller) => {
              const expanded = expandedId === seller.id;
              const pending = seller.verification_status === "pending";

              return (
                <article
                  key={seller.id}
                  className="group rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg md:p-5"
                  onClick={() => setExpandedId(expanded ? null : seller.id)}
                >
                  <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_auto] lg:items-start">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-green)]/20 to-[var(--brand-green-bright)]/20 text-2xl">
                        🏪
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-black text-base text-[var(--text-primary)]">{seller.shop_name}</h3>
                          <StatusBadge status={seller.verification_status} verified={seller.verification_badge} />
                        </div>
                        <p className="mt-1 truncate text-sm text-[var(--text-muted)]">{seller.owner_name} · {seller.owner_email}</p>

                        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                          <div className="rounded-2xl bg-[var(--surface-secondary)] px-3 py-2">
                            <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Products</p>
                            <p className="mt-0.5 text-sm font-black text-[var(--text-primary)]">{formatNumber(seller.product_count || 0)}</p>
                          </div>
                          <div className="rounded-2xl bg-[var(--surface-secondary)] px-3 py-2">
                            <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Reviews</p>
                            <p className="mt-0.5 text-sm font-black text-[var(--text-primary)]">{formatNumber(seller.review_count || 0)}</p>
                          </div>
                          <div className="rounded-2xl bg-[var(--surface-secondary)] px-3 py-2">
                            <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Earnings</p>
                            <p className="mt-0.5 text-sm font-black text-[var(--text-primary)]">{money(Number(seller.total_earnings || 0))}</p>
                          </div>
                          <div className="rounded-2xl bg-[var(--surface-secondary)] px-3 py-2">
                            <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Followers</p>
                            <p className="mt-0.5 text-sm font-black text-[var(--text-primary)]">{formatNumber(seller.followers_count || 0)}</p>
                          </div>
                          <div className="rounded-2xl bg-[var(--surface-secondary)] px-3 py-2">
                            <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Performance</p>
                            <p className="mt-0.5 text-sm font-black text-[var(--text-primary)]">{Number(seller.performance_score || 0).toFixed(1)}</p>
                          </div>
                          <div className="rounded-2xl bg-[var(--surface-secondary)] px-3 py-2">
                            <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Commission</p>
                            <p className="mt-0.5 text-sm font-black text-[var(--text-primary)]">{Number(seller.commission_rate || 0).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                      {pending && (
                        <>
                          <button disabled={busy} onClick={() => setConfirmAction({ id: seller.id, action: "verified" })} className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white transition-all hover:bg-emerald-600 disabled:opacity-50" type="button">
                            ✓ Approve
                          </button>
                          <button disabled={busy} onClick={() => setConfirmAction({ id: seller.id, action: "rejected" })} className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white transition-all hover:bg-red-600 disabled:opacity-50" type="button">
                            ✕ Reject
                          </button>
                        </>
                      )}

                      <select
                        value={seller.subscription_plan || "basic"}
                        onChange={(event) => updateSeller(seller.id, { subscriptionPlan: event.target.value })}
                        disabled={busy}
                        className="themed-select !py-2 !px-3 !text-xs !rounded-xl !w-24"
                      >
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                      </select>

                      <input
                        type="number"
                        defaultValue={seller.commission_rate}
                        onBlur={(event) => {
                          const value = Number.parseFloat(event.target.value);
                          if (value >= 0 && value <= 100) updateSeller(seller.id, { commissionRate: value });
                        }}
                        disabled={busy}
                        className="w-20 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-xs font-black text-[var(--text-primary)]"
                        placeholder="%"
                        min="0"
                        max="100"
                        step="0.1"
                      />

                      <button className="rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-xs font-black text-[var(--text-secondary)] transition-all hover:bg-[var(--tab-hover-bg)] hover:text-[var(--text-primary)]" type="button">
                        {expanded ? "Hide details" : "View details"}
                      </button>
                    </div>
                  </div>

                  {confirmAction?.id === seller.id && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-500/10 p-3 ring-1 ring-amber-500/20">
                      <p className="text-sm font-bold text-[var(--text-secondary)]">{confirmAction.action === "verified" ? "Approve this seller?" : "Reject this seller?"}</p>
                      <div className="flex gap-2">
                        <button onClick={(event) => { event.stopPropagation(); updateSeller(seller.id, { verificationStatus: confirmAction.action }); }} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-white transition-all hover:bg-amber-600" type="button">
                          Confirm
                        </button>
                        <button onClick={(event) => { event.stopPropagation(); setConfirmAction(null); }} className="rounded-xl border border-[var(--border-primary)] px-3 py-2 text-xs font-black text-[var(--text-muted)] transition-all hover:text-[var(--text-primary)] hover:bg-[var(--tab-hover-bg)]" type="button">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {expanded && (
                    <div className="mt-4 border-t border-[var(--border-subtle)] pt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                      <div><p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Email</p><p className="mt-1 text-xs font-bold text-[var(--text-secondary)]">{seller.owner_email || "—"}</p></div>
                      <div><p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Phone</p><p className="mt-1 text-xs font-bold text-[var(--text-secondary)]">{seller.phone || "—"}</p></div>
                      <div><p className="text-[10px] font-black uppercase text-[var(--text-muted)]">City</p><p className="mt-1 text-xs font-bold text-[var(--text-secondary)]">{seller.city || "—"}</p></div>
                      <div><p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Plan</p><p className="mt-1 text-xs font-black text-[var(--text-primary)] capitalize">{seller.subscription_plan || "basic"}</p></div>
                      <div><p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Status</p><p className="mt-1 text-xs font-black text-[var(--text-primary)] capitalize">{seller.verification_status}</p></div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed right-4 top-4 z-[9999] animate-modal-enter rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] px-4 py-3 text-sm font-black shadow-lg">
          {toast.type === "error" ? "❌" : "✅"} {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
}