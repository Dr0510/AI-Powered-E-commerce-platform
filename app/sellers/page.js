"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { StoreHeader } from "@/components/StoreShell";

const CATEGORIES = ["All", "Electronics", "Fashion", "Home", "Beauty", "Sports", "Books", "Food"];

export default function SellersPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        const data = await api("/api/sellers");
        setSellers(data.sellers || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...sellers];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.shop_name?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q));
    }
    if (activeCat !== "All") {
      list = list.filter(s => s.category?.toLowerCase() === activeCat.toLowerCase());
    }
    return list;
  }, [sellers, search, activeCat]);

  const totalFollowers = useMemo(() => sellers.reduce((s, x) => s + (x.followers_count || 0), 0), [sellers]);

  return (
    <div className="luxury-shell min-h-screen">
      <StoreHeader />

      {/* ═══════ HERO ═══════ */}
      <section className="sellers-hero">
        <div className="sellers-hero-content max-w-7xl mx-auto px-4">
          <h1>🏪 Our Sellers</h1>
          <p>Discover amazing stores and shop from verified sellers on DR MART</p>
          <div className="sellers-search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="sellers-search"
              placeholder="Search stores by name or category..."
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveCat("All"); }}
            />
          </div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="glass-panel rounded-xl sellers-stats">
          <div className="sellers-stat">
            <div className="sellers-stat-value" style={{ color: "var(--brand-green)" }}>{sellers.length}</div>
            <div className="sellers-stat-label">Total Stores</div>
          </div>
          <div className="sellers-stat">
            <div className="sellers-stat-value" style={{ color: "var(--brand-gold)" }}>
              {sellers.length > 0 ? "★" : "-"}
            </div>
            <div className="sellers-stat-label">Avg Rating</div>
          </div>
          <div className="sellers-stat">
            <div className="sellers-stat-value" style={{ color: "var(--text-accent)" }}>{totalFollowers}</div>
            <div className="sellers-stat-label">Total Followers</div>
          </div>
        </div>
      </div>

      {/* ═══════ CATEGORY CHIPS ═══════ */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="sellers-categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`sellers-cat-chip ${activeCat === cat ? "active" : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ SELLERS GRID / EMPTY / LOADING ═══════ */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="sellers-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="seller-card overflow-hidden">
                  <div className="seller-card-banner">
                    <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
                  </div>
                  <div className="seller-card-body p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton skeleton-text" style={{ width: '66%' }} />
                        <div className="skeleton skeleton-text-sm" style={{ width: '33%' }} />
                      </div>
                    </div>
                    <div className="skeleton skeleton-text-sm" style={{ width: '50%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">{search || activeCat !== "All" ? "🔎" : "🏪"}</div>
            <h3 className="text-xl font-black mb-2">
              {search || activeCat !== "All" ? "No stores found" : "No sellers yet"}
            </h3>
            <p className="text-[var(--text-muted)] mb-6">
              {search || activeCat !== "All"
                ? "Try a different search or category."
                : "Be the first to open your store!"}
            </p>
            {(search || activeCat !== "All") ? (
              <button onClick={() => { setSearch(""); setActiveCat("All"); }}
                className="px-6 py-3 rounded-xl bg-[var(--brand-green)] text-white font-black hover:shadow-lg transition-all">
                Clear Filters
              </button>
            ) : (
              <Link href="/become-seller" className="inline-block px-6 py-3 rounded-xl bg-[var(--brand-green)] text-white font-black hover:shadow-lg transition-all">
                Become a Seller
              </Link>
            )}
          </div>
        ) : (
          <div className="sellers-grid stagger-children">
            {filtered.map((seller) => (
              <Link
                key={seller.id}
                href={`/store/${seller.shop_slug}`}
                className="seller-card stagger-in"
                style={{ animationDelay: `${(filtered.indexOf(seller) % 8) * 60}ms` }}
              >
                {/* Banner */}
                <div className="seller-card-banner">
                  {seller.banner_url ? (
                    <img src={seller.banner_url} alt="" />
                  ) : (
                    <div style={{
                      background: `linear-gradient(135deg, ${seller.verification_status === "verified" ? "#0c3b35,#176e63" : "#5a4a3a,#8a7a6a"})`,
                      height: "100%"
                    }} />
                  )}
                </div>
                <div className="seller-card-body">
                  {/* Logo */}
                  <div className="seller-card-logo">
                    {seller.logo_url ? (
                      <img src={seller.logo_url} alt="" />
                    ) : (
                      <span className="text-xl">🏪</span>
                    )}
                  </div>
                  {/* Name + Verified */}
                  <div className="seller-card-name">
                    {seller.shop_name}
                    {seller.verification_badge && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-bold">✓</span>
                    )}
                  </div>
                  <div className="seller-card-category">{seller.category || "General Store"}</div>
                  {/* Meta */}
                  <div className="seller-card-meta">
                    <div className="seller-card-rating">
                      <span className="star">⭐</span>
                      {Number(seller.performance_score || 0).toFixed(1)}
                    </div>
                    <div className="seller-card-followers">👥 {seller.followers_count || 0}</div>
                    <span className="seller-card-cta">Visit Store →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ═══════ CTA ═══════ */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="glass-panel rounded-2xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-green)]/5 to-[var(--brand-gold)]/5" />
          <div className="relative">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-2xl font-black mb-2">Want to Sell on DR MART?</h2>
            <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">Join our marketplace and reach thousands of customers.</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/become-seller" className="px-8 py-3 rounded-xl bg-[var(--brand-green)] text-white font-black hover:shadow-lg transition-all">
                Open Your Store →
              </Link>
              <Link href="/leaderboard" className="px-8 py-3 rounded-xl border-2 border-[var(--border-primary)] font-black text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-all">
                🏆 Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}