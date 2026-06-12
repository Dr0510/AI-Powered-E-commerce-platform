"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useToast, ToastContainer } from "@/components/Toast";
import DashboardHero from "@/components/DashboardHero";
import DashboardKPI from "@/components/DashboardKPI";
import DashboardAnalytics from "@/components/DashboardAnalytics";
import DashboardQuickActions from "@/components/DashboardQuickActions";
import DashboardRecentOrders from "@/components/DashboardRecentOrders";
import DashboardTopProducts from "@/components/DashboardTopProducts";
import DashboardEarnings from "@/components/DashboardEarnings";

// ─── Skeleton Loaders ───────────────────────────────────────
function SkeletonHero() {
  return (
    <div className="rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-elevated)]/70 p-6 md:p-8 backdrop-blur-xl">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl skeleton" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-48 skeleton rounded-lg" />
          <div className="h-4 w-72 skeleton rounded-lg" />
          <div className="h-4 w-40 skeleton rounded-lg" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 skeleton rounded-xl" />
          <div className="h-10 w-28 skeleton rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function SkeletonKPI() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="h-3 w-20 skeleton rounded" />
            <div className="h-9 w-9 skeleton rounded-xl" />
          </div>
          <div className="mt-3 h-6 w-28 skeleton rounded" />
          <div className="mt-2 h-3 w-24 skeleton rounded" />
          <div className="mt-3 h-8 w-full skeleton rounded" />
        </div>
      ))}
    </div>
  );
}

function SkeletonOrders() {
  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
      <div className="p-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 skeleton rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 w-32 skeleton rounded" />
            <div className="h-3 w-20 skeleton rounded" />
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-8 h-8 skeleton rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 skeleton rounded" />
              <div className="h-2 w-24 skeleton rounded" />
            </div>
            <div className="h-6 w-16 skeleton rounded-full" />
            <div className="h-4 w-20 skeleton rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function SellerDashboard() {
  const router = useRouter();
  const { toasts, showToast, dismissToast } = useToast();

  const [seller, setSeller] = useState(null);
  const [stats, setStats] = useState({});
  const [statsError, setStatsError] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vacationToggling, setVacationToggling] = useState(false);

  // Fetch all data
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        // Fetch seller data
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

        // Fetch stats
        try {
          const statsData = await api(`/api/sellers/${sellerData.seller.id}/stats`);
          if (active) setStats(statsData);
        } catch (e) {
          console.error("Stats load failed:", e);
          if (active) setStatsError(true);
        }

        // Fetch orders
        try {
          const ordersData = await api("/api/sellers/orders");
          if (active && ordersData.orders) setOrders(ordersData.orders);
        } catch (e) {
          console.error("Orders load failed:", e);
        }

        // Fetch products
        try {
          const productsData = await api("/api/sellers/products?limit=10");
          if (active && productsData.products) setProducts(productsData.products);
        } catch (e) {
          console.error("Products load failed:", e);
        }
      } catch (error) {
        console.error("Dashboard load failed:", error);
        showToast("Failed to load dashboard data", "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  // Toggle vacation mode
  const toggleVacation = useCallback(async () => {
    setVacationToggling(true);
    try {
      const data = await api("/api/sellers/me", {
        method: "PATCH",
        body: JSON.stringify({ vacation_mode: !seller.vacation_mode }),
      });
      if (data.seller) setSeller(data.seller);
      showToast(
        seller.vacation_mode ? "Store is now visible" : "Vacation mode activated",
        "success"
      );
    } catch (error) {
      showToast("Failed to update vacation mode", "error");
    } finally {
      setVacationToggling(false);
    }
  }, [seller, showToast]);

  // ─── Loading State ──────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <SkeletonHero />
        <SkeletonKPI />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-48 skeleton rounded-2xl" />
          <div className="h-48 skeleton rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
        <SkeletonOrders />
      </div>
    );
  }

  // ─── Non-Seller State ────────────────────────────────────
  if (!seller) {
    return (
      <motion.div
        className="rounded-3xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-8 shadow-xl max-w-2xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-green-bright)] text-4xl shadow-lg shadow-[var(--brand-green)]/20"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          🏪
        </motion.div>
        <h1 className="text-2xl font-black mb-2 text-[var(--text-primary)]">
          Not a Seller Yet
        </h1>
        <p className="text-[var(--text-muted)] mb-6 text-sm leading-6">
          Become a seller on DR MART and start selling your products to thousands of customers.
        </p>
        <Link
          href="/become-seller"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white font-black text-sm shadow-lg shadow-[var(--brand-green)]/20 hover:shadow-xl hover:shadow-[var(--brand-green)]/30 transition-all hover:-translate-y-0.5"
        >
          Become a Seller
        </Link>
      </motion.div>
    );
  }

  // ─── Render Dashboard ─────────────────────────────────────
  return (
    <div className="space-y-6 page-transition">
      {/* Vacation Banner */}
      {seller.vacation_mode && (
        <motion.div
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl flex-shrink-0">
              ⏸️
            </div>
            <div>
              <p className="font-black text-sm text-amber-700 dark:text-amber-400">
                Vacation Mode Active
              </p>
              <p className="text-xs font-bold text-amber-600/80 dark:text-amber-500/80 mt-1">
                Your products are temporarily hidden from customers.
              </p>
            </div>
          </div>
          <button
            onClick={toggleVacation}
            disabled={vacationToggling}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-white hover:bg-amber-600 transition-all disabled:opacity-50"
            type="button"
          >
            {vacationToggling ? "…" : "Disable"}
          </button>
        </motion.div>
      )}

      {/* Hero Section */}
      <DashboardHero seller={seller} />

      {/* KPI Analytics Cards */}
      <DashboardKPI stats={stats} seller={seller} />

      {/* Analytics Dashboard */}
      <DashboardAnalytics
        stats={stats}
        orders={orders}
        products={products}
      />

      {/* Quick Actions */}
      <DashboardQuickActions />

      {/* Two-column: Orders + Earnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DashboardRecentOrders orders={orders} />
        </div>
        <div>
          <DashboardEarnings seller={seller} stats={stats} />
        </div>
      </div>

      {/* Top Products */}
      <DashboardTopProducts products={products} />

      {/* Store Link Card */}
      {seller.shop_slug && (
        <motion.div
          className="rounded-3xl border border-[var(--border-primary)] bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--card-bg)] p-6 shadow-sm backdrop-blur-xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[var(--text-primary)]">
                Your Store Page
              </h2>
              <p className="text-sm text-[var(--text-muted)] font-bold mt-1">
                Customers can view your store at:
              </p>
            </div>
            <a
              href={`/store/${seller.shop_slug}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-[var(--brand-green)]/20 hover:shadow-xl hover:shadow-[var(--brand-green)]/30 transition-all hover:-translate-y-0.5"
              rel="noreferrer"
            >
              /store/{seller.shop_slug} ↗
            </a>
          </div>
        </motion.div>
      )}

      {/* Stats Error Banner */}
      {statsError && (
        <motion.div
          className="rounded-3xl border border-[var(--border-primary)] bg-[var(--empty-state-bg)] p-8 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--badge-gold-bg)] text-2xl">
            ⚠️
          </div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">
            Stats temporarily unavailable
          </h2>
          <p className="text-sm text-[var(--text-muted)] font-bold mt-2">
            Your store data is still loading. Please check back shortly.
          </p>
        </motion.div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}