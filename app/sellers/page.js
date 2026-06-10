"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { StoreHeader } from "@/components/StoreShell";

export default function SellersPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api("/api/sellers?verified=true");
        setSellers(data.sellers || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="luxury-shell min-h-screen">
      <StoreHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black mb-2">Our Sellers</h1>
          <p className="text-[var(--text-muted)]">Discover verified stores on DR MART</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--brand-green)] border-t-transparent" />
          </div>
        ) : !Array.isArray(sellers) || sellers.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <p className="font-bold text-[var(--text-muted)]">No sellers registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Array.isArray(sellers) ? sellers : []).map((seller) => (
              <Link key={seller.id} href={`/store/${seller.shop_slug}`} className="glass-panel rounded-xl p-6 hover:-translate-y-1 transition-all hover:shadow-xl group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center overflow-hidden shrink-0">
                    {seller.logo_url ? (
                      <img src={seller.logo_url} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                      <span className="text-2xl">🏪</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black truncate">{seller.shop_name}</h3>
                      {seller.verification_badge && (
                        <span className="text-blue-500 shrink-0" title="Verified">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate">{seller.category || "General Store"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">⭐ {Number(seller.performance_score || 0).toFixed(1)}</span>
                  <span className="text-[var(--text-muted)]">{seller.followers_count || 0} followers</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Become a Seller CTA */}
        <div className="mt-10 glass-panel rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-2xl font-black mb-2">Want to Sell on DR MART?</h2>
          <p className="text-[var(--text-muted)] mb-6">Join our marketplace and reach thousands of customers</p>
          <Link href="/become-seller" className="inline-block btn-primary px-8 py-3 rounded-lg font-black">Become a Seller</Link>
        </div>
      </main>
    </div>
  );
}