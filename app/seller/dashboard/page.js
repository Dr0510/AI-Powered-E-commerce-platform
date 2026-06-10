"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast, ToastContainer } from "@/components/Toast";

export default function SellerDashboard() {
  const [seller, setSeller] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, dismissToast } = useToast();

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const userData = await api("/api/auth/me");
        if (!userData.user) throw new Error("Not authenticated");

        const sellerData = await api("/api/sellers/me");
        if (!active) return;

        if (!sellerData.seller) {
          setSeller(null);
          setLoading(false);
          return;
        }

        setSeller(sellerData.seller);
        try {
          const statsData = await api(`/api/sellers/${sellerData.seller.id}/stats`);
          if (active) setStats(statsData);
        } catch (e) {
          console.error("Stats load failed:", e);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--brand-green)] border-t-transparent mx-auto" />
        <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">Loading dashboard...</p>
      </div>
    </div>
  );

  if (!seller) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🏪</div>
        <h1 className="text-2xl font-black mb-2 text-[var(--text-primary)]">Not a Seller Yet</h1>
        <p className="text-[var(--text-muted)] mb-6">Become a seller on DR MART and start selling your products to thousands of customers.</p>
        <Link href="/become-seller" className="inline-block btn-primary px-6 py-3 rounded font-black">Become a Seller</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--brand-green)] text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xs font-bold opacity-80 hover:opacity-100">← Storefront</Link>
              <h1 className="text-xl md:text-2xl font-black">{seller.shop_name}</h1>
              {seller.verification_badge && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
                  ✓ Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold capitalize">{seller.subscription_plan} Plan</span>
            </div>
          </div>
        </div>
      </header>

      {seller.vacation_mode && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <span>⏸️</span>
            <span className="font-bold text-sm">Vacation Mode Active — Your products are hidden from customers</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel rounded-xl p-5">
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Total Earnings</p>
            <p className="text-2xl font-black mt-1 text-[var(--brand-green)]">₹{Number(seller.total_earnings || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="glass-panel rounded-xl p-5">
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Performance</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-black">{Number(seller.performance_score || 0).toFixed(1)}</p>
              <span className="text-sm">⭐</span>
            </div>
          </div>
          <div className="glass-panel rounded-xl p-5">
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Followers</p>
            <p className="text-2xl font-black mt-1">{seller.followers_count || 0}</p>
          </div>
          <div className="glass-panel rounded-xl p-5">
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Commission</p>
            <p className="text-2xl font-black mt-1">{seller.commission_rate || 0}%</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-panel rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-[var(--brand-green)]">{stats.products || 0}</p>
            <p className="text-xs font-bold text-[var(--text-muted)] mt-1">Products</p>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-[var(--brand-green)]">{stats.orders || 0}</p>
            <p className="text-xs font-bold text-[var(--text-muted)] mt-1">Orders</p>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-[var(--brand-green)]">{Number(stats.avgRating || 0).toFixed(1)}</p>
            <p className="text-xs font-bold text-[var(--text-muted)] mt-1">Avg Rating</p>
          </div>
        </div>

        <h2 className="text-lg font-black mb-4 text-[var(--text-primary)]">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Link href="/seller/products" className="glass-panel rounded-xl p-5 text-center hover:-translate-y-1 transition-all hover:shadow-lg group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📦</div>
            <p className="font-black text-sm">Manage Products</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Add/Edit/Delete</p>
          </Link>
          <Link href="/seller/coupons" className="glass-panel rounded-xl p-5 text-center hover:-translate-y-1 transition-all hover:shadow-lg group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🎟️</div>
            <p className="font-black text-sm">Coupons</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Create offers</p>
          </Link>
          <Link href="/seller/orders" className="glass-panel rounded-xl p-5 text-center hover:-translate-y-1 transition-all hover:shadow-lg group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📋</div>
            <p className="font-black text-sm">Orders</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Track & update</p>
          </Link>
          <Link href="/seller/payouts" className="glass-panel rounded-xl p-5 text-center hover:-translate-y-1 transition-all hover:shadow-lg group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">💰</div>
            <p className="font-black text-sm">Payouts</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Earnings & withdraw</p>
          </Link>
          <Link href="/seller/messages" className="glass-panel rounded-xl p-5 text-center hover:-translate-y-1 transition-all hover:shadow-lg group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">💬</div>
            <p className="font-black text-sm">Messages</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Chat with customers</p>
          </Link>
          <Link href="/seller/analytics" className="glass-panel rounded-xl p-5 text-center hover:-translate-y-1 transition-all hover:shadow-lg group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</div>
            <p className="font-black text-sm">Analytics</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Sales insights</p>
          </Link>
          <Link href="/seller/bulk-upload" className="glass-panel rounded-xl p-5 text-center hover:-translate-y-1 transition-all hover:shadow-lg group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📤</div>
            <p className="font-black text-sm">Bulk Upload</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">CSV/Excel import</p>
          </Link>
          <Link href="/seller/settings" className="glass-panel rounded-xl p-5 text-center hover:-translate-y-1 transition-all hover:shadow-lg group">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">⚙️</div>
            <p className="font-black text-sm">Settings</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Store & profile</p>
          </Link>
        </div>

        {seller.shop_slug && (
          <div className="mt-8 glass-panel rounded-xl p-5">
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