"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Banknote,
} from "lucide-react";

function MiniRevenueTrend() {
  const data = [45, 52, 48, 62, 58, 70, 65, 78, 72, 85, 92, 88];
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  const padding = 2;
  const stepX = (width - padding * 2) / (data.length - 1);

  const points = data.map((val, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${width - padding},${height - padding} L${padding},${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16">
      <defs>
        <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-green-bright)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--brand-green-bright)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#earningsGradient)" />
      <path d={linePath} fill="none" stroke="var(--brand-green-bright)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.filter((_, i) => i % 3 === 0).map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="1.5"
          fill="var(--brand-green-bright)"
          stroke="var(--card-bg)"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export default function DashboardEarnings({ seller, stats }) {
  const totalEarnings = Number(seller?.total_earnings || 0);
  const availableBalance = Math.round(totalEarnings * 0.7);
  const pendingBalance = totalEarnings - availableBalance;
  const lastPayout = seller?.last_payout_at
    ? new Date(seller.last_payout_at).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <motion.section
      className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
    >
      <div className="relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-green)]/5 via-transparent to-[var(--brand-gold)]/5" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-bl from-[var(--brand-green)]/10 to-transparent rounded-full blur-2xl" />

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-[var(--text-primary)]">Earnings</h2>
                <p className="text-xs text-[var(--text-muted)] font-medium">Revenue overview</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              +12.5%
            </span>
          </div>

          {/* Balance */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Available Balance</p>
              <p className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight">
                ₹{(availableBalance / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  Pending: <span className="font-bold text-[var(--text-primary)]">₹{(pendingBalance / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}</span>
                </span>
              </div>
              {lastPayout && (
                <div className="flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    Last payout: {lastPayout}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Revenue trend mini chart */}
          <div className="mt-4 -mx-5">
            <MiniRevenueTrend />
          </div>

          {/* Withdraw button */}
          <Link
            href="/seller/payouts"
            className="mt-4 inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white text-sm font-black shadow-lg shadow-[var(--brand-green)]/20 hover:shadow-xl hover:shadow-[var(--brand-green)]/30 transition-all hover:-translate-y-0.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            Withdraw Earnings
          </Link>
        </div>
      </div>
    </motion.section>
  );
}