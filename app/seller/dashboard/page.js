"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast, ToastContainer } from "@/components/Toast";

export default function SellerDashboard() {
  const [seller, setSeller] = useState(null);
  const [stats, setStats] = useState({});
  const [statsError, setStatsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, dismissToast } = useToast();

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        // Parallelize: fetch seller data and stats simultaneously
        const [sellerData] = await Promise.all([
          api("/api/sellers/me"),
        ]);
        if (!active) return;

        if (!sellerData.seller) {
          setSeller(null);
          setLoading(false);
          return;
        }

        setSeller(sellerData.seller);

        // Fetch stats in parallel
        try {
          const statsData = await api(`/api/sellers/${sellerData.seller.id}/stats`);
          if (active) setStats(statsData);
        } catch (e) {
          console.error("Stats load failed:", e);
          if (active) setStatsError(true);
        }
      } catch (error) {
        console.error(error);
        showToast("Failed to load dashboard data", "error");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  if (loading) return (
    <div className="themed-shell flex items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--brand-green)] border-t-transparent mx-auto" />
        <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">Loading dashboard...</p>
      </div>
    </div>
  );

  if (!seller) return (
    <div className="themed-shell flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🏪</div>
        <h1 className="text-2xl font-black mb-2 text-[var(--text-primary)]">Not a Seller Yet</h1>
        <p className="text-[var(--text-muted)] mb-6">Become a seller on DR MART and start selling your products to thousands of customers.</p>
        <Link href="/become-seller" className="inline-block btn-primary px-6 py-3 rounded font-black">Become a Seller</Link>
      </div>
    </div>
  );

  return (
    <div className="themed-shell">
      {/* ═══════ HEADER ═══════ */}
      <header className="seller-dash-header">
        <div className="seller-dash-header-content max-w-7xl mx-auto px-4 py-4 md:py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xs font-bold text-white/70 hover:text-white transition-colors">← Storefront</Link>
              <h1 className="seller-dash-title">{seller.shop_name}</h1>
              {seller.verification_badge && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
                  ✓ Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold capitalize text-white/80">{seller.subscription_plan} Plan</span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════ VACATION BANNER ═══════ */}
      {seller.vacation_mode && (
        <div className="seller-dash-vacation">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <span>⏸️</span>
            <span className="font-bold text-sm">Vacation Mode Active — Your products are hidden from customers</span>
          </div>
        </div>
      )}

      {/* ═══════ MAIN CONTENT ═══════ */}
      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* ── Earnings & Stats Row (4 cards) ── */}
        <div className="seller-dash-stagger grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="seller-dash-stat-card">
            <p className="seller-dash-stat-label">Total Earnings</p>
            <p className="seller-dash-stat-value green">₹{Number(seller.total_earnings || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="seller-dash-stat-card">
            <p className="seller-dash-stat-label">Performance</p>
            <div className="flex items-center gap-2 mt-2">
              <p className="seller-dash-stat-value">{Number(seller.performance_score || 0).toFixed(1)}</p>
              <span className="text-lg">⭐</span>
            </div>
          </div>
          <div className="seller-dash-stat-card">
            <p className="seller-dash-stat-label">Followers</p>
            <p className="seller-dash-stat-value gold">{seller.followers_count || 0}</p>
          </div>
          <div className="seller-dash-stat-card">
            <p className="seller-dash-stat-label">Commission</p>
            <p className="seller-dash-stat-value accent">{seller.commission_rate || 0}%</p>
          </div>
        </div>

        {/* ── Quick Stats Row (3 cards) ── */}
        <div className="seller-dash-stagger grid grid-cols-3 gap-4 mb-8">
          <div className="seller-dash-quick-stat">
            <p className="stat-number">{stats.products || 0}</p>
            <p className="stat-label">Products</p>
          </div>
          <div className="seller-dash-quick-stat">
            <p className="stat-number">{stats.orders || 0}</p>
            <p className="stat-label">Orders</p>
          </div>
          <div className="seller-dash-quick-stat">
            <p className="stat-number">{Number(stats.avgRating || 0).toFixed(1)}</p>
            <p className="stat-label">Avg Rating</p>
          </div>
        </div>

        {/* ── Section Title ── */}
        <h2 className="text-lg font-black mb-4 text-[var(--text-primary)]">Quick Actions</h2>

        {/* ── Quick Actions Grid ── */}
        <div className="seller-dash-stagger grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Link href="/seller/products" className="seller-dash-action-card">
            <span className="action-emoji">📦</span>
            <p className="action-title">Manage Products</p>
            <p className="action-sub">Add/Edit/Delete</p>
          </Link>
          <Link href="/seller/coupons" className="seller-dash-action-card">
            <span className="action-emoji">🎟️</span>
            <p className="action-title">Coupons</p>
            <p className="action-sub">Create offers</p>
          </Link>
          <Link href="/seller/orders" className="seller-dash-action-card">
            <span className="action-emoji">📋</span>
            <p className="action-title">Orders</p>
            <p className="action-sub">Track & update</p>
          </Link>
          <Link href="/seller/payouts" className="seller-dash-action-card">
            <span className="action-emoji">💰</span>
            <p className="action-title">Payouts</p>
            <p className="action-sub">Earnings & withdraw</p>
          </Link>
          <Link href="/seller/messages" className="seller-dash-action-card">
            <span className="action-emoji">💬</span>
            <p className="action-title">Messages</p>
            <p className="action-sub">Chat with customers</p>
          </Link>
          <Link href="/seller/analytics" className="seller-dash-action-card">
            <span className="action-emoji">📊</span>
            <p className="action-title">Analytics</p>
            <p className="action-sub">Sales insights</p>
          </Link>
          <Link href="/seller/bulk-upload" className="seller-dash-action-card">
            <span className="action-emoji">📤</span>
            <p className="action-title">Bulk Upload</p>
            <p className="action-sub">CSV/Excel import</p>
          </Link>
          <Link href="/seller/settings" className="seller-dash-action-card">
            <span className="action-emoji">⚙️</span>
            <p className="action-title">Settings</p>
            <p className="action-sub">Store & profile</p>
          </Link>
        </div>

        {/* ── Store Link Card ── */}
        {seller.shop_slug && (
          <div className="seller-dash-store-link mt-8">
            <h2 className="text-lg font-black mb-2 text-[var(--text-primary)]">Your Store Page</h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">Customers can view your store at:</p>
            <a href={`/store/${seller.shop_slug}`} target="_blank" className="text-[var(--brand-green)] font-bold hover:underline text-sm">
              /store/{seller.shop_slug} ↗
            </a>
          </div>
        )}
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}