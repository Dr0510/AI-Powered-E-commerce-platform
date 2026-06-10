"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
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

  return (
    <div className="luxury-shell min-h-screen">
      <StoreHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black mb-2">🏆 Top Sellers</h1>
          <p className="text-[var(--text-muted)]">Our highest-rated and most popular stores</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--brand-green)] border-t-transparent" />
          </div>
        ) : topSellers.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <p className="font-bold text-[var(--text-muted)]">No sellers yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topSellers.map((seller, index) => (
              <Link key={seller.id} href={`/store/${seller.shop_slug}`} className="glass-panel rounded-xl p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-all hover:shadow-lg group">
                <div className="w-10 text-center shrink-0">
                  {index === 0 ? <span className="text-3xl">🥇</span> : index === 1 ? <span className="text-3xl">🥈</span> : index === 2 ? <span className="text-3xl">🥉</span> : (
                    <span className="text-2xl font-black text-[var(--text-muted)]">#{index + 1}</span>
                  )}
                </div>
                <div className="h-14 w-14 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center overflow-hidden shrink-0">
                  {seller.logo_url ? (
                    <img src={seller.logo_url} alt="" className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="text-xl">🏪</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black truncate">{seller.shop_name}</h3>
                    {seller.verification_badge && <span className="text-blue-500 shrink-0 text-xs">✓ Verified</span>}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">{seller.category || "General Store"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-lg">{Number(seller.performance_score || 0).toFixed(1)}</p>
                  <p className="text-xs text-[var(--text-muted)]">{seller.followers_count || 0} followers</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}