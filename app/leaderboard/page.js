"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { StoreHeader } from "@/components/StoreShell";

export default function LeaderboardPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api("/api/sellers");
        const sorted = (data.sellers || []).sort((a, b) => (Number(b.performance_score) || 0) - (Number(a.performance_score) || 0));
        setSellers(sorted);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const topSellers = sellers.slice(0, 20);
  const maxScore = topSellers.length > 0 ? Math.max(...topSellers.map(s => Number(s.performance_score) || 0), 1) : 1;

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
    }),
  };

  return (
    <div className="luxury-shell min-h-screen">
      <StoreHeader />
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0c3b35] via-[#176e63] to-[#c99646] px-4 py-12 md:py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#f4d7a1] backdrop-blur-sm">DR MART Leaderboard</span>
            <h1 className="mt-4 text-4xl font-black text-white md:text-5xl">🏆 Top Sellers</h1>
            <p className="mx-auto mt-3 max-w-xl text-base text-white/70">Our highest-rated and most popular stores, ranked by performance score. Climb the ranks and earn your badge.</p>
          </motion.div>
          <motion.div
            className="mt-8 flex items-center justify-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm">
              <span className="text-[#f4d7a1]">★</span> {topSellers.length} Sellers
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm">
              <span className="text-[#f4d7a1]">📈</span> Top Score: {maxScore.toFixed(1)}
            </div>
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--brand-green)] border-t-transparent" />
            <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">Loading leaderboard…</p>
          </div>
        ) : topSellers.length === 0 ? (
          <motion.div
            className="glass-panel rounded-2xl p-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--badge-gold-bg)] text-4xl">🏆</div>
            <h3 className="text-xl font-black">No sellers yet</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Be the first to join the leaderboard!</p>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          >
            {topSellers.map((seller, index) => {
              const score = Number(seller.performance_score) || 0;
              const barWidth = (score / maxScore) * 100;
              const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;
              return (
                <motion.div key={seller.id} variants={fadeUp} custom={index}>
                  <Link
                    href={`/store/${seller.shop_slug}`}
                    className="group relative block rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-green-bright)] hover:shadow-[var(--card-hover-shadow)] md:p-5"
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex w-10 shrink-0 items-center justify-center md:w-12">
                        {medal ? (
                          <motion.span
                            className="text-2xl md:text-3xl"
                            initial={{ rotate: -20, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15, delay: index * 0.05 + 0.2 }}
                          >{medal}</motion.span>
                        ) : (
                          <span className="text-lg font-black text-[var(--text-muted)] md:text-xl">#{index + 1}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-secondary)] ring-2 ring-[var(--border-subtle)] transition-all duration-300 group-hover:ring-[var(--brand-green-bright)] md:h-16 md:w-16">
                        {seller.logo_url ? (
                          <img src={seller.logo_url} alt="" className="h-full w-full object-contain p-1.5" />
                        ) : (
                          <span className="text-xl">🏪</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-black md:text-base">{seller.shop_name}</h3>
                          {seller.verification_badge && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">✓ Verified</span>
                          )}
                          {index < 3 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--badge-gold-bg)] px-2 py-0.5 text-[10px] font-black text-[var(--badge-gold-text)]">Top {index + 1}</span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{seller.category || "General Store"}</p>

                        {/* Score bar */}
                        <div className="mt-2 h-1.5 rounded-full bg-[var(--surface-secondary)]">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background: index === 0
                                ? "linear-gradient(90deg, #c99646, #f4d7a1)"
                                : index === 1
                                  ? "linear-gradient(90deg, #94a3b8, #cbd5e1)"
                                  : index === 2
                                    ? "linear-gradient(90deg, #cd7f32, #d4a574)"
                                    : "linear-gradient(90deg, var(--brand-green), var(--brand-green-bright))",
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(barWidth, 4)}%` }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.04 }}
                          />
                        </div>
                      </div>

                      {/* Score & Followers */}
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-black md:text-xl">{score.toFixed(1)}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <span>👥</span> {seller.followers_count || 0}
                        </p>
                      </div>

                      {/* Arrow */}
                      <div className="hidden shrink-0 text-[var(--text-muted)] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[var(--brand-green)] sm:block">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
    </div>
  );
}