"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast, ToastContainer } from "@/components/Toast";

export default function SellerAnalytics() {
  const [seller, setSeller] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, dismissToast } = useToast();

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const sellerData = await api("/api/sellers/me");
        if (!active) return;
        if (!sellerData.seller) throw new Error("Not a seller");

        setSeller(sellerData.seller);

        // Fetch stats and orders in parallel
        const [statsData, ordersData] = await Promise.all([
          api(`/api/sellers/${sellerData.seller.id}/stats`).catch(() => ({})),
          api("/api/sellers/orders").catch(() => ({ orders: [] })),
        ]);

        const orders = ordersData.orders || [];
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total_in_paise || 0), 0);
        const paidOrders = orders.filter(o => o.fulfillment_status === "delivered").length;

        if (active) setStats(prev => ({ ...prev, ...statsData, revenue: totalRevenue / 100, paidOrders }));
      } catch (error) {
        showToast(error.message, "error");
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
        <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">Loading analytics...</p>
      </div>
    </div>
  );

  const metrics = [
    { label: "Total Products", value: stats.products || 0, icon: "📦" },
    { label: "Total Orders", value: stats.orders || 0, icon: "📋" },
    { label: "Delivered", value: stats.paidOrders || 0, icon: "✅" },
    { label: "Revenue", value: `₹${(stats.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: "💰" },
    { label: "Avg Rating", value: Number(stats.avgRating || 0).toFixed(1), icon: "⭐" },
    { label: "Performance", value: Number(seller?.performance_score || 0).toFixed(2), icon: "📊" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--brand-green)] text-white px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/seller/dashboard" className="text-xs font-bold opacity-80 hover:opacity-100">← Dashboard</Link>
          <h1 className="text-xl font-black mt-1">Analytics</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {metrics.map((metric) => (
            <div key={metric.label} className="glass-panel rounded-xl p-5 text-center">
              <div className="text-2xl mb-2">{metric.icon}</div>
              <p className="text-2xl font-black text-[var(--brand-green)]">{metric.value}</p>
              <p className="text-xs font-bold text-[var(--text-muted)] mt-1">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="glass-panel rounded-xl p-6">
          <h2 className="text-lg font-black mb-4 text-[var(--text-primary)]">Seller Performance</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[var(--text-secondary)]">Performance Score</span>
                <span className="text-sm font-black">{Number(seller?.performance_score || 0).toFixed(2)} / 5.00</span>
              </div>
              <div className="h-3 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-[var(--brand-green)] to-blue-500 transition-all" style={{ width: `${(Number(seller?.performance_score || 0) / 5) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[var(--text-secondary)]">Commission Rate</span>
                <span className="text-sm font-black">{seller?.commission_rate || 0}%</span>
              </div>
              <div className="h-3 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--brand-green)]" style={{ width: `${seller?.commission_rate || 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 glass-panel rounded-xl p-6">
          <h2 className="text-lg font-black mb-4 text-[var(--text-primary)]">How to Improve</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold">•</span>
              <span className="text-[var(--text-secondary)]">Maintain high product ratings by providing quality products</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold">•</span>
              <span className="text-[var(--text-secondary)]">Ship orders quickly to reduce delivery times</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold">•</span>
              <span className="text-[var(--text-secondary)]">Respond to customer messages promptly</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold">•</span>
              <span className="text-[var(--text-secondary)]">Keep products in stock and update inventory regularly</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500 font-bold">•</span>
              <span className="text-[var(--text-secondary)]">Use coupons and promotions to attract more buyers</span>
            </li>
          </ul>
        </div>
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}