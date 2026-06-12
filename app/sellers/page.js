"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { StoreHeader } from "@/components/StoreShell";
import {
  Store,
  Search,
  Star,
  ShieldCheck,
  Users,
  MapPin,
  ArrowUpDown,
  CheckCircle2,
  ExternalLink,
  Tag,
  X,
  SlidersHorizontal,
} from "lucide-react";

const DEFAULT_CATEGORIES = ["All", "Electronics", "Fashion", "Home", "Beauty", "Sports", "Books", "Food"];

const SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "verified", label: "Verified first" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "A to Z" },
];

const BANNER_GRADIENTS = [
  "bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-gold)]",
  "bg-gradient-to-br from-blue-800 to-indigo-600",
  "bg-gradient-to-br from-amber-800 to-orange-600",
  "bg-gradient-to-br from-teal-800 to-emerald-600",
  "bg-gradient-to-br from-violet-800 to-purple-600",
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  }),
};

const numberFormatter = new Intl.NumberFormat("en-IN");
function formatNumber(value) { return numberFormatter.format(Number(value || 0)); }

function getInitials(name = "") {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "DR";
  return words.slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function sellerLocation(seller) {
  const parts = [seller.city, seller.state].filter(Boolean);
  return parts.length ? parts.join(", ") : "Online Store";
}

function sellerDescription(seller) {
  return seller.description || seller.business_description || `${seller.shop_name || "This store"} offers curated products for everyday shopping.`;
}

// ─── Seller Card ──────────────────────────────────────────
function SellerCard({ seller, index }) {
  const score = Number(seller.performance_score || 0);
  const isVerified = seller.verification_badge || seller.verification_status === "verified";
  const slug = seller.shop_slug || seller.id;
  const initials = getInitials(seller.shop_name);
  const location = sellerLocation(seller);
  const description = sellerDescription(seller);

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Link
        href={`/store/${slug}`}
        className="group block h-full rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-sm hover:shadow-xl transition-all overflow-hidden"
      >
        {/* Banner */}
        <div className={`relative h-28 ${BANNER_GRADIENTS[index % BANNER_GRADIENTS.length]} overflow-hidden`}>
          {seller.banner_url && (
            <img src={seller.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
              isVerified
                ? "bg-emerald-500/90 text-white"
                : "bg-white/80 text-[var(--text-secondary)]"
            } backdrop-blur-sm`}>
              {isVerified ? <CheckCircle2 className="w-3 h-3" /> : "•"}
              {isVerified ? "Verified" : "Store"}
            </span>
            {seller.vacation_mode && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-amber-400/90 text-amber-900 backdrop-blur-sm">
                Open soon
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 pt-0">
          {/* Logo */}
          <div className="-mt-8 mb-3 relative z-10">
            <div className="w-14 h-14 rounded-xl border-2 border-[var(--card-bg)] bg-[var(--surface-secondary)] overflow-hidden shadow-lg">
              {seller.logo_url ? (
                <img src={seller.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-base font-black text-[var(--text-accent)] bg-gradient-to-br from-[var(--brand-green)]/20 to-[var(--brand-green-bright)]/20">
                  {initials}
                </div>
              )}
            </div>
          </div>

          {/* Name + Verified */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black text-[var(--text-primary)] truncate group-hover:text-[var(--text-accent)] transition-colors">
                {seller.shop_name || "Untitled Store"}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs font-medium text-[var(--text-muted)]">
                <Tag className="w-3 h-3" />
                <span>{seller.category || "General Store"}</span>
                <span>•</span>
                <MapPin className="w-3 h-3" />
                <span className="truncate">{location}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="mt-2 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* Metrics */}
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className={`w-3.5 h-3.5 ${score > 0 ? "text-amber-400 fill-amber-400" : "text-[var(--text-muted)]"}`} />
              <span className="text-sm font-black text-[var(--text-primary)]">{score > 0 ? score.toFixed(1) : "—"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-sm font-bold text-[var(--text-primary)]">{formatNumber(seller.followers_count)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-muted)]">View storefront</span>
            <span className="text-xs font-black text-[var(--text-accent)] group-hover:gap-2 transition-all inline-flex items-center gap-1">
              Open store <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────
function SellerSkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] overflow-hidden">
      <div className="h-28 skeleton rounded-none" />
      <div className="p-4 pt-0">
        <div className="-mt-8 mb-3 relative z-10">
          <div className="w-14 h-14 rounded-xl border-2 border-[var(--card-bg)] skeleton" />
        </div>
        <div className="h-4 w-36 skeleton rounded mt-2" />
        <div className="h-3 w-48 skeleton rounded mt-2" />
        <div className="h-8 w-full skeleton rounded mt-2" />
        <div className="flex gap-4 mt-3">
          <div className="h-4 w-12 skeleton rounded" />
          <div className="h-4 w-16 skeleton rounded" />
        </div>
        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
          <div className="h-3 w-24 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function SellersPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [sortBy, setSortBy] = useState("popular");

  const loadSellers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/sellers");
      setSellers(Array.isArray(data?.sellers) ? data.sellers : []);
    } catch (loadError) {
      console.error(loadError);
      setError("We could not load the seller directory. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadSellers, 0);
    return () => window.clearTimeout(timer);
  }, [loadSellers]);

  const publicSellers = useMemo(() => {
    return sellers.filter(seller => seller.verification_status !== "rejected");
  }, [sellers]);

  const categories = useMemo(() => {
    const dynamicCategories = publicSellers
      .map(seller => seller.category)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...dynamicCategories]));
  }, [publicSellers]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = publicSellers.filter(seller => {
      const searchable = [
        seller.shop_name, seller.category, seller.description,
        seller.business_description, seller.city, seller.state,
      ].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesCategory = activeCat === "All" || seller.category?.toLowerCase() === activeCat.toLowerCase();
      return matchesSearch && matchesCategory;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "verified":
          return Number(b.verification_badge || b.verification_status === "verified") - Number(a.verification_badge || a.verification_status === "verified") || Number(b.followers_count || 0) - Number(a.followers_count || 0);
        case "rating":
          return Number(b.performance_score || 0) - Number(a.performance_score || 0) || Number(b.followers_count || 0) - Number(a.followers_count || 0);
        case "newest":
          return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
        case "name":
          return String(a.shop_name || "").localeCompare(String(b.shop_name || ""));
        case "popular":
        default:
          return Number(b.followers_count || 0) - Number(a.followers_count || 0) || Number(b.performance_score || 0) - Number(a.performance_score || 0);
      }
    });
    return list;
  }, [publicSellers, search, activeCat, sortBy]);

  const stats = useMemo(() => {
    const totalFollowers = publicSellers.reduce((sum, seller) => sum + Number(seller.followers_count || 0), 0);
    const ratedSellers = publicSellers.filter(seller => Number(seller.performance_score || 0) > 0);
    const avgRating = ratedSellers.length
      ? ratedSellers.reduce((sum, seller) => sum + Number(seller.performance_score || 0), 0) / ratedSellers.length
      : 0;
    const verifiedCount = publicSellers.filter(seller => seller.verification_badge || seller.verification_status === "verified").length;
    return { totalFollowers, avgRating, verifiedCount };
  }, [publicSellers]);

  const activeFilterCount = useMemo(() => {
    return [search.trim().length > 0, activeCat !== "All", sortBy !== "popular"].filter(Boolean).length;
  }, [search, activeCat, sortBy]);

  const clearFilters = () => { setSearch(""); setActiveCat("All"); setSortBy("popular"); };

  return (
    <div className="luxury-shell min-h-screen">
      <StoreHeader />

      <main id="main-content">
        {/* ─── Hero Section ─────────────────────────────── */}
        <section className="relative overflow-hidden" aria-labelledby="sellers-page-title">
          {/* Background orbs */}
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-bl from-[var(--brand-green)]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-[var(--brand-gold)]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-16 items-center">
              {/* Left copy */}
              <div className="lg:col-span-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--brand-green)]/10 text-[var(--brand-green-bright)] text-xs font-black uppercase tracking-wider mb-4">
                  <Store className="w-3.5 h-3.5" />
                  Curated seller marketplace
                </div>
                <h1 id="sellers-page-title" className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--text-primary)] leading-[0.96] tracking-tight">
                  Discover trusted storefronts in one premium marketplace.
                </h1>
                <p className="mt-4 text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
                  Explore verified sellers, compare ratings, follow your favorite stores, and shop from businesses that match your style.
                </p>
                <div className="flex flex-wrap gap-3 mt-8">
                  <Link
                    href="/become-seller"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white font-black text-sm shadow-lg shadow-[var(--brand-green)]/20 hover:shadow-xl hover:shadow-[var(--brand-green)]/30 transition-all hover:-translate-y-0.5"
                  >
                    <Store className="w-4 h-4" />
                    Become a Seller
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] text-[var(--text-primary)] font-black text-sm hover:border-[var(--brand-gold)] hover:shadow-lg transition-all hover:-translate-y-0.5"
                  >
                    <Star className="w-4 h-4" />
                    View Top Sellers
                  </Link>
                </div>
                <div className="flex flex-wrap gap-3 mt-6">
                  {[
                    { icon: ShieldCheck, text: "Verified storefronts" },
                    { icon: ShieldCheck, text: "Secure checkout" },
                    { icon: MapPin, text: "Local and online stores" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <span key={item.text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-muted)]">
                        <Icon className="w-3.5 h-3.5" />
                        {item.text}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Right stat card */}
              <motion.div
                className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-elevated)]/80 backdrop-blur-xl p-6 md:p-8 shadow-xl"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-bl from-[var(--brand-gold)]/20 to-transparent rounded-full blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-xs font-black text-white">
                      Marketplace live
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-primary)] text-xs font-bold text-[var(--text-muted)]">
                      Premium
                    </span>
                  </div>
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-gold)] flex items-center justify-center text-4xl shadow-xl shadow-[var(--brand-green)]/20 -rotate-6 mb-4">
                    🏪
                  </div>
                  <h2 className="text-xl font-black text-[var(--text-primary)] text-center">
                    Shop from sellers with transparent profiles.
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] text-center mt-2">
                    Each storefront shows ratings, followers, location, and verification status before you visit.
                  </p>
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    {[
                      { label: "Stores", value: formatNumber(publicSellers.length) },
                      { label: "Verified", value: stats.verifiedCount },
                      { label: "Followers", value: formatNumber(stats.totalFollowers) },
                    ].map((item) => (
                      <div key={item.label} className="p-3 rounded-xl bg-[var(--surface-primary)] border border-[var(--border-subtle)] text-center">
                        <p className="text-lg font-black text-[var(--text-primary)]">{item.value}</p>
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mt-1">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── Discovery Panel ──────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 -mt-6 relative z-10" aria-label="Seller discovery controls">
          {/* Search + Sort Toolbar */}
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)]/80 backdrop-blur-xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--text-muted)]" />
                <input
                  id="seller-search"
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-bold focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)]/20 focus:border-[var(--brand-green)]/40 transition-all"
                  type="search"
                  placeholder="Search stores by name, category, or location..."
                  value={search}
                  disabled={loading}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                  <select
                    className="h-12 pl-9 pr-8 rounded-xl bg-[var(--input-bg)] border border-[var(--border-primary)] text-sm font-bold text-[var(--text-primary)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)]/20 focus:border-[var(--brand-green)]/40 transition-all cursor-pointer"
                    value={sortBy}
                    disabled={loading}
                    aria-label="Sort sellers"
                    onChange={e => setSortBy(e.target.value)}
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <span className="inline-flex items-center px-3 py-2 rounded-lg bg-[var(--tab-active-bg)] text-xs font-black text-[var(--text-accent)] whitespace-nowrap">
                  {loading ? "Loading..." : `${filtered.length} ${filtered.length === 1 ? "store" : "stores"}`}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { icon: Store, label: "Total Stores", value: formatNumber(publicSellers.length), gradient: "from-emerald-500 to-teal-500" },
              { icon: Star, label: "Avg Rating", value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—", gradient: "from-amber-500 to-orange-500" },
              { icon: ShieldCheck, label: "Verified", value: formatNumber(stats.verifiedCount), gradient: "from-blue-500 to-cyan-500" },
              { icon: Users, label: "Followers", value: formatNumber(stats.totalFollowers), gradient: "from-violet-500 to-purple-500" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</p>
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="mt-2 text-xl font-black text-[var(--text-primary)]">{stat.value}</p>
                </div>
              );
            })}
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 mt-4" aria-label="Seller categories">
            {categories.map(category => (
              <button
                key={category}
                type="button"
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCat === category
                    ? "bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white shadow-sm"
                    : "bg-[var(--surface-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-green)]/30"
                }`}
                disabled={loading}
                onClick={() => setActiveCat(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* ─── Seller Grid ──────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 py-8 pb-20" aria-labelledby="featured-sellers-title">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-black text-[var(--brand-green-bright)] uppercase tracking-wider">Seller directory</p>
              <h2 id="featured-sellers-title" className="text-2xl font-black text-[var(--text-primary)] mt-1">Featured storefronts</h2>
            </div>
            <div>
              {activeFilterCount > 0 ? (
                <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-bold hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-all">
                  <X className="w-3.5 h-3.5" />
                  Clear {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
                </button>
              ) : (
                <span className="text-xs font-medium text-[var(--text-muted)]">Browse by category, rating, and popularity</span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SellerSkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--empty-state-bg)] p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-2xl mb-4">⚠️</div>
              <h3 className="text-lg font-black text-[var(--text-primary)]">Unable to load sellers</h3>
              <p className="text-sm text-[var(--text-muted)] mt-2 max-w-md mx-auto">{error}</p>
              <div className="flex gap-3 justify-center mt-6">
                <button type="button" onClick={loadSellers} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white font-black text-sm shadow-lg shadow-[var(--brand-green)]/20 hover:shadow-xl transition-all">
                  Retry
                </button>
                <Link href="/become-seller" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] text-[var(--text-primary)] font-black text-sm hover:border-[var(--brand-gold)] transition-all">
                  Become a Seller
                </Link>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--empty-state-bg)] p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface-secondary)] flex items-center justify-center text-2xl mb-4">
                {search || activeCat !== "All" || sortBy !== "popular" ? "🔎" : "🏪"}
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)]">
                {search || activeCat !== "All" || sortBy !== "popular" ? "No stores found" : "No sellers yet"}
              </h3>
              <p className="text-sm text-[var(--text-muted)] mt-2 max-w-md mx-auto">
                {search || activeCat !== "All" || sortBy !== "popular"
                  ? "Try a different search, category, or sorting option."
                  : "Be the first to open your store and reach customers on DR MART."}
              </p>
              <div className="flex gap-3 justify-center mt-6">
                {(search || activeCat !== "All" || sortBy !== "popular") ? (
                  <button type="button" onClick={clearFilters} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white font-black text-sm shadow-lg shadow-[var(--brand-green)]/20 hover:shadow-xl transition-all">
                    Clear filters
                  </button>
                ) : null}
                <Link href="/become-seller" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] text-[var(--text-primary)] font-black text-sm hover:border-[var(--brand-gold)] transition-all">
                  Open your store
                </Link>
              </div>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
            >
              {filtered.map((seller, index) => (
                <SellerCard key={seller.id || seller.shop_slug} seller={seller} index={index} />
              ))}
            </motion.div>
          )}
        </section>

        {/* ─── Bottom CTA ───────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 pb-20" aria-label="Seller onboarding">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--border-primary)] bg-gradient-to-br from-[var(--brand-green)]/5 via-[var(--surface-elevated)] to-[var(--brand-gold)]/5 backdrop-blur-xl p-8 md:p-12 text-center">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-[var(--brand-green)]/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-[var(--brand-gold)]/10 to-transparent rounded-full blur-3xl" />
            <div className="relative">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-green-bright)] flex items-center justify-center text-2xl shadow-xl shadow-[var(--brand-green)]/20 mb-4">
                🚀
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">Want to sell on DR MART?</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-3 max-w-lg mx-auto">
                Launch your storefront, manage products, and reach customers through a polished marketplace experience.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                <Link href="/become-seller" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white font-black text-sm shadow-lg shadow-[var(--brand-green)]/20 hover:shadow-xl hover:shadow-[var(--brand-green)]/30 transition-all hover:-translate-y-0.5">
                  <Store className="w-4 h-4" />
                  Open your store
                </Link>
                <Link href="/seller/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] text-[var(--text-primary)] font-black text-sm hover:border-[var(--brand-gold)] hover:shadow-lg transition-all hover:-translate-y-0.5">
                  Seller dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}