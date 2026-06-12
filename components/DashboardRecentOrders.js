"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Filter,
  X,
} from "lucide-react";

const statusColors = {
  paid: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]",
  pending: "bg-[var(--badge-gold-bg)] text-[var(--badge-gold-text)]",
  cancelled: "bg-[var(--badge-rose-bg)] text-[var(--badge-rose-text)]",
  delivered: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]",
  completed: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]",
  shipped: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  packed: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
};

const statusEmojis = {
  paid: "🟢",
  pending: "🟡",
  cancelled: "🔴",
  delivered: "✅",
  completed: "✅",
  shipped: "📦",
  packed: "📋",
};

function OrderRow({ order, index }) {
  const totalItems = order.items?.length || 0;
  const firstItem = order.items?.[0];
  const productName = firstItem?.title || firstItem?.product_name || `Order #${order.id?.toString().slice(-6)}`;
  const status = (order.status || order.fulfillment_status || "pending").toLowerCase();

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="border-b border-[var(--border-subtle)] last:border-b-0 group hover:bg-[var(--tab-hover-bg)] transition-colors"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-green)]/20 to-[var(--brand-green-bright)]/20 flex items-center justify-center text-xs font-black text-[var(--text-accent)]">
            {order.customer_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">{order.customer_name || "Guest"}</p>
            <p className="text-xs text-[var(--text-muted)]">{order.customer_email || ""}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[150px]">{productName}</p>
        <p className="text-xs text-[var(--text-muted)]">
          {totalItems > 1 ? `${totalItems} items` : "1 item"}
        </p>
      </td>
      <td className="py-3 px-4">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {order.created_at
            ? new Date(order.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
            : "—"}
        </p>
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[status] || "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400"}`}>
          {statusEmojis[status] || "●"} {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <p className="text-sm font-black text-[var(--text-primary)]">
          ₹{(order.total_in_paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
        </p>
      </td>
    </motion.tr>
  );
}

export default function DashboardRecentOrders({ orders = [] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchQuery ||
        order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id?.toString().includes(searchQuery);
      const matchesStatus = statusFilter === "all" || (order.status || order.fulfillment_status)?.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Reset page when filters change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <motion.section
      className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-[var(--text-primary)]">Recent Orders</h2>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 md:flex-none min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search orders..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)]/20 focus:border-[var(--brand-green)]/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center hover:bg-[var(--tab-hover-bg)]"
                  type="button"
                >
                  <X className="w-3 h-3 text-[var(--text-muted)]" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1 bg-[var(--surface-secondary)] rounded-xl p-1 border border-[var(--border-primary)]">
              {["all", "paid", "pending", "delivered"].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === status
                      ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm border border-[var(--border-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                  type="button"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {paginatedOrders.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-left py-3 px-4 text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Product</th>
                <th className="text-left py-3 px-4 text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order, index) => (
                <OrderRow key={order.id || index} order={order} index={index} />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-30 mb-3" />
            <p className="text-sm font-bold text-[var(--text-primary)]">No orders found</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {searchQuery ? "Try a different search term" : "No orders yet. Start selling!"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-muted)] font-medium">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              type="button"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  page === currentPage
                    ? "bg-[var(--brand-green)] text-white shadow-sm"
                    : "bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-primary)]"
                }`}
                type="button"
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              type="button"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* View all link */}
      <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--surface-secondary)]/50">
        <Link
          href="/seller/orders"
          className="text-xs font-bold text-[var(--text-accent)] hover:text-[var(--brand-green-bright)] transition-all inline-flex items-center gap-1"
        >
          View all orders →
        </Link>
      </div>
    </motion.section>
  );
}