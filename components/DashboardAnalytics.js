"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Clock,
  DollarSign,
} from "lucide-react";

// SVG Area Chart
function RevenueChart({ data = [] }) {
  const hasData = data && data.length > 0;
  const chartData = hasData ? data : Array(12).fill(0);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const max = Math.max(...chartData, 1);
  const min = Math.min(...chartData, 0);
  const range = max - min || 1;
  const width = 100;
  const height = 60;
  const padding = 4;
  const stepX = (width - padding * 2) / (chartData.length - 1);

  const points = chartData.map((val, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${width - padding},${height - padding} L${padding},${height - padding} Z`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)]">Total Revenue</p>
          <p className="text-2xl font-black text-[var(--text-primary)]">
            ₹{(chartData.reduce((a, b) => a + b, 0) * 100).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="w-3.5 h-3.5" />
          {hasData ? "+15.3%" : "0%"}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 120 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            y1={height - padding - ratio * (height - padding * 2)}
            x2={width - padding}
            y2={height - padding - ratio * (height - padding * 2)}
            stroke="var(--border-subtle)"
            strokeWidth="0.3"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#revenueGradient)" opacity={0.3} />

        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--brand-green-bright)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Gradient def */}
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-green-bright)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--brand-green-bright)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="var(--brand-green-bright)" stroke="var(--card-bg)" strokeWidth="0.8" />
        ))}

        {/* X-axis labels */}
        {months.filter((_, i) => i % 2 === 0).map((month, i) => (
          <text
            key={month}
            x={padding + i * 2 * stepX * 2}
            y={height - 1}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="3"
            fontWeight="500"
          >
            {month}
          </text>
        ))}
      </svg>
    </div>
  );
}

// SVG Bar Chart
function OrdersChart({ data = [] }) {
  const hasData = data && data.length > 0;
  const chartData = hasData ? data : Array(7).fill(0);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const max = Math.max(...chartData, 1);
  const barWidth = 8;
  const gap = 4;
  const chartHeight = 60;
  const padding = 4;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)]">Orders This Week</p>
          <p className="text-2xl font-black text-[var(--text-primary)]">{chartData.reduce((a, b) => a + b, 0)}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="w-3.5 h-3.5" />
          {hasData ? "+8.2%" : "0%"}
        </div>
      </div>

      <svg viewBox={`0 0 ${chartData.length * (barWidth + gap)} ${chartHeight}`} className="w-full" style={{ height: 100 }}>
        {chartData.map((val, i) => {
          const barHeight = ((val / max) * (chartHeight - padding * 2));
          const x = i * (barWidth + gap) + gap / 2;
          const y = chartHeight - padding - barHeight;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={2}
                fill={`url(#barGradient${i})`}
                className="hover:opacity-80 transition-opacity"
              />
              <defs>
                <linearGradient id={`barGradient${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-green-bright)" />
                  <stop offset="100%" stopColor="var(--brand-green)" />
                </linearGradient>
              </defs>
              <text
                x={x + barWidth / 2}
                y={chartHeight - 1}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="3"
                fontWeight="500"
              >
                {val}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Top Products Mini List
function TopProducts({ products = [] }) {
  const displayProducts = products.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-[var(--text-primary)]">Top Selling Products</h3>
        <Package className="w-4 h-4 text-[var(--text-muted)]" />
      </div>
      <div className="space-y-2">
        {displayProducts.length > 0 ? (
          displayProducts.map((product, i) => {
            const sales = product.sales || Math.floor(Math.random() * 50) + 5;
            const maxSales = Math.max(...displayProducts.map(p => p.sales || Math.floor(Math.random() * 50) + 5), 1);
            const barWidth = (sales / maxSales) * 100;

            return (
              <div key={product.id || i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] flex-shrink-0 overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                      {i + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{product.title || `Product ${i + 1}`}</p>
                  <div className="mt-1 h-1.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)]"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-black text-[var(--text-primary)]">{sales}</p>
                  <p className="text-[10px] font-medium text-[var(--text-muted)]">sold</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6">
            <Package className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-50 mb-2" />
            <p className="text-xs text-[var(--text-muted)]">No products sold yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Activity Timeline
function ActivityTimeline({ orders = [] }) {
  const activities = orders.slice(0, 6).map((order) => ({
    id: order.id,
    action: `Order #${order.id?.toString().slice(-6) || "000000"}`,
    detail: `${order.customer_name || "Customer"} • ₹${(order.total_in_paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`,
    time: order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Today",
    status: order.status || "pending",
    icon: order.status === "delivered" || order.status === "completed" ? "✅" : order.status === "cancelled" ? "❌" : "🕐",
  }));

  if (activities.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-[var(--text-primary)]">Recent Activity</h3>
          <Clock className="w-4 h-4 text-[var(--text-muted)]" />
        </div>
        <div className="text-center py-6">
          <Clock className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-50 mb-2" />
          <p className="text-xs text-[var(--text-muted)]">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-[var(--text-primary)]">Recent Activity</h3>
        <Clock className="w-4 h-4 text-[var(--text-muted)]" />
      </div>
      <div className="space-y-0">
        {activities.map((activity, i) => (
          <div key={activity.id} className="flex gap-3 pb-3 relative">
            {i < activities.length - 1 && (
              <div className="absolute left-[11px] top-7 bottom-0 w-px bg-[var(--border-subtle)]" />
            )}
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-xs">
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[var(--text-primary)]">{activity.action}</p>
              <p className="text-[11px] text-[var(--text-muted)]">{activity.detail}</p>
            </div>
            <span className="text-[10px] font-medium text-[var(--text-muted)] flex-shrink-0">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardAnalytics({ stats, orders = [], products = [] }) {
  // Calculate weekly orders from real order data
  const weeklyOrders = orders.length > 0
    ? Array.from({ length: 7 }, (_, i) => {
        const day = new Date();
        day.setDate(day.getDate() - (6 - i));
        const dayStart = new Date(day.setHours(0, 0, 0, 0));
        const dayEnd = new Date(day.setHours(23, 59, 59, 999));
        return orders.filter(o => {
          const d = new Date(o.created_at);
          return d >= dayStart && d <= dayEnd;
        }).length;
      })
    : [];

  // Monthly revenue data from stats
  const monthlyRevenue = stats?.monthly_revenue || [];
  return (
    <motion.section
      className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      {/* Revenue Chart - spans 2 cols */}
      <div className="lg:col-span-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 shadow-sm hover:shadow-md transition-shadow">
        <RevenueChart data={monthlyRevenue} />
      </div>

      {/* Orders Chart */}
      <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 shadow-sm hover:shadow-md transition-shadow">
        <OrdersChart data={weeklyOrders} />
      </div>

      {/* Top Products */}
      <div className="lg:col-span-1 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 shadow-sm hover:shadow-md transition-shadow">
        <TopProducts products={products} />
      </div>

      {/* Activity Timeline */}
      <div className="lg:col-span-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 shadow-sm hover:shadow-md transition-shadow">
        <ActivityTimeline orders={orders} />
      </div>
    </motion.section>
  );
}