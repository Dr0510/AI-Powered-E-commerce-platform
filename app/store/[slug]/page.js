"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { StoreHeader, StatusPill, deliveryEstimate } from "@/components/StoreShell";
import { useToast, ToastContainer } from "@/components/Toast";

/* ── Constants ── */
const TABS = [
  { id: "products", label: "Products", icon: "🛍️" },
  { id: "about", label: "About Store", icon: "ℹ️" },
  { id: "reviews", label: "Reviews", icon: "💬" },
  { id: "policies", label: "Policies", icon: "📋" },
];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "name", label: "Name A → Z" },
];
const REVIEW_SORT_OPTIONS = [
  { value: "newest", label: "Most Recent" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
];
const PRODUCTS_PER_PAGE = 12;
const REVIEWS_PER_PAGE = 5;

/* ── Loading Skeleton ── */
function StoreSkeleton() {
  return (
    <div className="luxury-shell min-h-screen">
      <StoreHeader />
      <div className="store-hero-skeleton">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="skeleton" style={{ width: 128, height: 128, borderRadius: 24 }} />
            <div className="flex-1 w-full space-y-4">
              <div className="skeleton skeleton-heading" style={{ width: "50%", margin: "0 auto" }} />
              <div className="skeleton skeleton-text" style={{ width: "70%", margin: "0 auto" }} />
              <div className="flex gap-3 justify-center">
                <div className="skeleton" style={{ width: 130, height: 44, borderRadius: 12 }} />
                <div className="skeleton" style={{ width: 130, height: 44, borderRadius: 12 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="skeleton skeleton-heading mb-6" style={{ width: 200 }} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-img" />
              <div className="skeleton skeleton-text" style={{ width: "80%" }} />
              <div className="skeleton skeleton-text-sm" style={{ width: "40%" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Star Display ── */
function StarRating({ rating, size = "sm", interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  const sizeClass = size === "lg" ? "text-xl" : size === "md" ? "text-lg" : "text-sm";
  return (
    <div className={`star-rating ${sizeClass}`}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={`star-btn ${star <= rating ? "star-filled" : "star-empty"} ${interactive ? "star-interactive" : ""}`}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          {star <= rating ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

/* ── Star Distribution Bars ── */
function StarDistribution({ reviews }) {
  const distribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => { if (dist[r.rating] !== undefined) dist[r.rating]++; });
    const total = reviews.length;
    return Object.entries(dist).reverse().map(([stars, count]) => ({
      stars: Number(stars), count,
      pct: total > 0 ? (count / total) * 100 : 0,
    }));
  }, [reviews]);

  return (
    <div className="star-distribution space-y-1.5">
      {distribution.map((d) => (
        <div key={d.stars} className="flex items-center gap-2 text-xs">
          <span className="font-bold w-8 text-right text-[var(--text-secondary)]">{d.stars}★</span>
          <div className="flex-1 h-2.5 rounded-full bg-[var(--skeleton-base)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--brand-gold)] transition-all duration-700" style={{ width: `${d.pct}%` }} />
          </div>
          <span className="font-bold w-6 text-[var(--text-muted)]">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Product Card ── */
function ProductCard({ product, onAddToCart, onToggleWishlist, isInWishlist }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const stockStatus = product.stock <= 0 ? "out" : product.stock < 6 ? "low" : "in";
  const stockLabel = product.stock <= 0 ? "Out of Stock" : product.stock < 6 ? `Only ${product.stock} left` : "In Stock";

  async function handleAddToCart(e) {
    e.preventDefault();
    if (stockStatus === "out") return;
    setAdding(true);
    try { await onAddToCart?.(product); setAdded(true); setTimeout(() => setAdded(false), 1500); }
    catch (err) { console.error(err); }
    finally { setAdding(false); }
  }

  return (
    <Link href={`/product/${product._id}`} className="store-product-card group">
      <div className="store-product-img-wrap">
        {!imgLoaded && <div className="skeleton absolute inset-0" />}
        {product.image ? (
          <img src={product.image} alt={product.title}
            className={`store-product-img ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImgLoaded(true)} />
        ) : (
          <span className="text-4xl opacity-30 group-hover:scale-110 transition-transform">📦</span>
        )}
        <span className={`store-stock-badge ${stockStatus}`}>{stockLabel}</span>
        <button onClick={(e) => { e.preventDefault(); onToggleWishlist?.(product._id); }}
          className={`store-wishlist-btn ${isInWishlist ? "active" : ""}`}
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}>
          <span className={isInWishlist ? "heart-filled" : ""}>{isInWishlist ? "❤️" : "🤍"}</span>
        </button>
        <div className="store-quick-add">
          <button onClick={handleAddToCart} disabled={stockStatus === "out" || adding}
            className={`store-quick-add-btn ${added ? "added" : ""}`}>
            {added ? "✓ Added" : adding ? "..." : "Add to Cart"}
          </button>
        </div>
      </div>
      <div className="p-2.5 space-y-1.5">
        <h3 className="store-product-title">{product.title}</h3>
        <div className="flex items-center justify-between">
          <span className="store-product-price">{money(product.price)}</span>
          {product.compare_at_price > product.price && (
            <span className="store-product-compare">{money(product.compare_at_price)}</span>
          )}
        </div>
        <p className="store-product-delivery">{deliveryEstimate(product.stock)}</p>
      </div>
    </Link>
  );
}

/* ── Review Card ── */
function ReviewCard({ review }) {
  return (
    <div className="store-review-card stagger-in">
      <div className="flex items-start gap-3">
        <div className="store-review-avatar">
          {review.buyer_avatar ? (
            <img src={review.buyer_avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{review.buyer_name?.charAt(0)?.toUpperCase() || "C"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--text-primary)]">{review.buyer_name || "Customer"}</span>
              <span className="text-xs text-[var(--text-muted)]">{new Date(review.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
            </div>
            <StarRating rating={review.rating} size="sm" />
          </div>
          {review.comment && (
            <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{review.comment}</p>
          )}
          {review.images?.length > 0 && (
            <div className="mt-2 flex gap-2">
              {review.images.map((img, i) => (
                <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover border border-[var(--border-subtle)]" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════ */
export default function StorePage() {
  const params = useParams();
  const slug = params?.slug;
  const { toasts, showToast, dismissToast } = useToast();

  /* ── State ── */
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [following, setFollowing] = useState(false);
  const [wishlist, setWishlist] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);

  /* ── UI State ── */
  const [activeTab, setActiveTab] = useState("products");
  const [bannerModal, setBannerModal] = useState(false);

  /* Close banner modal on Escape key */
  useEffect(() => {
    if (!bannerModal) return;
    function onKey(e) { if (e.key === "Escape") setBannerModal(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bannerModal]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [visibleProducts, setVisibleProducts] = useState(PRODUCTS_PER_PAGE);
  const [reviewSort, setReviewSort] = useState("newest");
  const [visibleReviews, setVisibleReviews] = useState(REVIEWS_PER_PAGE);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  /* ── Data Loading ── */
  const loadSellerProducts = useCallback(async (sellerId) => {
    try {
      const productsData = await api(`/api/products?sellerId=${sellerId}&limit=50&active=true`);
      return Array.isArray(productsData.products) ? productsData.products : [];
    } catch (e) { return []; }
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      try {
        const sellersData = await api(`/api/sellers?slug=${encodeURIComponent(slug)}`);
        if (cancelled) return;
        const sellersList = Array.isArray(sellersData.sellers) ? sellersData.sellers : [];
        if (!sellersList.length) { setLoading(false); return; }
        const sellerData = sellersList[0];
        setSeller(sellerData);

        const sellerProducts = await loadSellerProducts(sellerData.id);
        if (!cancelled) { setProducts(sellerProducts); setTotalProducts(sellerProducts.length); }

        try {
          const userData = await api("/api/auth/me");
          if (!cancelled) setUser(userData.user);
          if (userData.user) {
            const followingData = await api("/api/sellers/follow");
            if (!cancelled) {
              setFollowing(followingData.following?.some(f => String(f.seller_id) === String(sellerData.id)));
            }
          }
        } catch (e) {}

        try {
          const reviewsData = await api(`/api/sellers/reviews?sellerId=${sellerData.id}`);
          if (!cancelled) setReviews(Array.isArray(reviewsData.reviews) ? reviewsData.reviews : []);
        } catch (e) {}

        if (!cancelled) setLoading(false);
      } catch (error) {
        console.error("Store page error:", error);
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug, loadSellerProducts]);

  /* ── Actions ── */
  async function toggleFollow() {
    if (!user) return showToast("Sign in to follow", "warn");
    try {
      const data = await api("/api/sellers/follow", { method: "POST", body: JSON.stringify({ sellerId: seller.id }) });
      setFollowing(data.following);
      showToast(data.following ? "Following store! 🎉" : "Unfollowed", "success");
    } catch (error) { showToast(error.message, "error"); }
  }

  async function submitReview(event) {
    event.preventDefault();
    if (!user) return showToast("Sign in to review", "warn");
    if (!reviewForm.comment.trim()) return showToast("Please write a review", "warn");
    setSubmitting(true);
    try {
      await api("/api/sellers/reviews", { method: "POST", body: JSON.stringify({ sellerId: seller.id, ...reviewForm }) });
      showToast("Review submitted! 🎉", "success");
      setReviewForm({ rating: 5, comment: "" });
      const reviewsData = await api(`/api/sellers/reviews?sellerId=${seller.id}`);
      setReviews(reviewsData.reviews || []);
    } catch (error) { showToast(error.message, "error"); }
    finally { setSubmitting(false); }
  }

  async function shareStore() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: seller.shop_name, url }); } catch (e) {}
    } else {
      try { await navigator.clipboard.writeText(url); setCopied(true); showToast("Store link copied! 📋", "success", 2000); setTimeout(() => setCopied(false), 2000); }
      catch (e) { showToast("Failed to copy link", "error"); }
    }
  }

  async function contactSeller() {
    if (!user) return showToast("Sign in to contact seller", "warn");
    try {
      await api("/api/sellers/chat", { method: "POST", body: JSON.stringify({ sellerId: seller.id, message: "Hello! I'm interested in your products." }) });
      showToast("Message sent! Check Messages tab. 💬", "success");
    } catch (error) { showToast(error.message, "error"); }
  }

  async function handleAddToCart(product) {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existing = cart.findIndex(item => item._id === product._id);
      if (existing >= 0) { cart[existing].quantity = (cart[existing].quantity || 1) + 1; }
      else { cart.push({ ...product, quantity: 1 }); }
      localStorage.setItem("cart", JSON.stringify(cart));
      showToast("Added to cart! 🛒", "success");
    } catch (e) { showToast("Failed to add to cart", "error"); }
  }

  function toggleWishlist(productId) {
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(productId)) { next.delete(productId); showToast("Removed from wishlist", "info"); }
      else { next.add(productId); showToast("Added to wishlist ❤️", "success"); }
      return next;
    });
  }

  /* ── Derived Data ── */
  const tags = useMemo(() => {
    const tagSet = new Set();
    products.forEach(p => { if (p.tags) p.tags.split(",").forEach(t => tagSet.add(t.trim())); });
    return Array.from(tagSet).slice(0, 15);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (searchQuery) { const q = searchQuery.toLowerCase(); filtered = filtered.filter(p => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)); }
    if (selectedTag) { filtered = filtered.filter(p => p.tags?.toLowerCase().includes(selectedTag.toLowerCase())); }
    switch (sortBy) {
      case "price-asc": filtered.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case "price-desc": filtered.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case "name": filtered.sort((a, b) => (a.title || "").localeCompare(b.title || "")); break;
      default: filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break;
    }
    return filtered;
  }, [products, searchQuery, selectedTag, sortBy]);

  const paginatedProducts = useMemo(() => filteredProducts.slice(0, visibleProducts), [filteredProducts, visibleProducts]);

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    switch (reviewSort) {
      case "highest": sorted.sort((a, b) => b.rating - a.rating); break;
      case "lowest": sorted.sort((a, b) => a.rating - b.rating); break;
      default: sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break;
    }
    return sorted;
  }, [reviews, reviewSort]);

  const paginatedReviews = useMemo(() => sortedReviews.slice(0, visibleReviews), [sortedReviews, visibleReviews]);

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const formattedDate = seller?.created_at ? new Date(seller.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "";

  /* ── Loading State ── */
  if (!slug || loading) return <StoreSkeleton />;

  /* ── Not Found ── */
  if (!seller) return (
    <div className="luxury-shell min-h-screen">
      <StoreHeader />
      <div className="empty-state max-w-md mx-auto mt-20">
        <div className="empty-icon">🔍</div>
        <h3>Store Not Found</h3>
        <p>This store doesn't exist or has been removed.</p>
        <Link href="/" className="mt-6 btn-primary px-6 py-3 rounded-lg font-black text-sm">Browse Products</Link>
      </div>
    </div>
  );

  return (
    <div className="luxury-shell min-h-screen">
      <StoreHeader />

      {/* ═══════ ANNOUNCEMENT ═══════ */}
      {seller.announcement_banner && (
        <div className="store-announcement">
          <span className="store-announcement-icon">📢</span>
          <span>{seller.announcement_banner}</span>
        </div>
      )}

      {/* ═══════ PREMIUM STORE HEADER ═══════ */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        {/* Breadcrumb */}
        <nav className="store-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">›</span>
          <Link href="/sellers">Sellers</Link>
          <span className="sep">›</span>
          <span className="current">{seller.shop_name}</span>
        </nav>

        {/* Premium Header Card */}
        <div className="store-header-premium">
          {/* Banner — Clickable to open fullscreen */}
          <div
            className="store-header-banner"
            style={{ cursor: seller.banner_url ? "zoom-in" : "default" }}
            onClick={() => seller.banner_url && setBannerModal(true)}
            role={seller.banner_url ? "button" : undefined}
            tabIndex={seller.banner_url ? 0 : undefined}
            onKeyDown={(e) => { if (e.key === "Enter" && seller.banner_url) setBannerModal(true); }}
          >
            {seller.banner_url ? (
              <img src={seller.banner_url} alt="" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-green)] via-[var(--brand-green-bright)] to-[var(--brand-gold)]" />
            )}
            <div className="overlay" />
            {seller.banner_url && (
              <span className="absolute top-3 right-3 text-xs font-bold bg-black/40 text-white px-2.5 py-1 rounded-lg backdrop-blur-sm">🔍 Click to zoom</span>
            )}
          </div>

          {/* Info Overlay */}
          <div className="store-header-info">
            <div className="store-header-logo">
              {seller.logo_url ? (
                <img src={seller.logo_url} alt={seller.shop_name} />
              ) : (
                <span className="text-3xl">🏪</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 w-full">
              <div className="store-header-text">
                <h1>{seller.shop_name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="sub">{seller.category || "General Store"}</span>
                  {seller.verification_badge && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">✓ Verified</span>
                  )}
                  {seller.verification_status === "pending" && (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full font-bold">⏳ Pending</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="store-header-actions">
                <button onClick={toggleFollow}
                  className={`btn ${following ? "btn-primary following" : "btn-primary"}`}>
                  {following ? "❤️ Following" : "➕ Follow Store"}
                </button>
                <button onClick={shareStore} className="btn btn-secondary">
                  {copied ? "✅" : "🔗"} Share
                </button>
                <button onClick={contactSeller} className="btn btn-secondary">
                  💬 Contact
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="store-header-stats w-full">
              <div className="store-header-stat">
                <span>⭐</span>
                <span className="num">{avgRating}</span>
                <span>({reviews.length} reviews)</span>
              </div>
              <div className="store-header-stat">
                <span>👥</span>
                <span className="num">{seller.followers_count || 0}</span>
                <span>followers</span>
              </div>
              <div className="store-header-stat">
                <span>📦</span>
                <span className="num">{totalProducts}</span>
                <span>products</span>
              </div>
              {seller.city && (
                <div className="store-header-stat">
                  <span>📍</span><span className="num">{seller.city}</span>
                </div>
              )}
              {formattedDate && (
                <div className="store-header-stat">
                  <span>📅</span><span>Since {formattedDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ TABS ═══════ */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="store-tabs" role="tablist">
          {TABS.map((tab) => {
            const count = tab.id === "products" ? totalProducts : tab.id === "reviews" ? reviews.length : null;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`store-tab ${activeTab === tab.id ? "active" : ""}`}
              >
                {tab.icon} {tab.label}
                {count !== null && (
                  <span className="ml-1.5 text-xs font-bold opacity-60">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ═══════ TAB CONTENT ═══════ */}
        <div className="store-tab-content" key={activeTab}>

          {/* ──── PRODUCTS TAB ──── */}
          {activeTab === "products" && (
            <section className="pb-16">
              {seller.vacation_mode ? (
                <div className="store-empty-premium">
                  <div className="icon-wrap">⏸️</div>
                  <h3>Store on Vacation</h3>
                  <p>This store is currently taking a break. Check back later!</p>
                </div>
              ) : products.length === 0 ? (
                <div className="store-empty-premium">
                  <div className="icon-wrap">📦</div>
                  <h3>No Products Yet</h3>
                  <p>This seller hasn't listed any products yet. Check back soon!</p>
                  {user && (
                    <button onClick={toggleFollow}
                      className="px-6 py-3 rounded-xl bg-[var(--brand-green)] text-white font-black hover:shadow-lg transition-all">
                      ❤️ Follow to get notified
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Search + Sort */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">🔍</span>
                      <input type="text" value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setVisibleProducts(PRODUCTS_PER_PAGE); }}
                        placeholder="Search products in this store..."
                        className="store-search-input" />
                      {searchQuery && (
                        <button onClick={() => { setSearchQuery(""); setVisibleProducts(PRODUCTS_PER_PAGE); }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">✕</button>
                      )}
                    </div>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                      className="store-sort-select">
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="store-tags-scroll mb-6">
                      <button onClick={() => { setSelectedTag(""); setVisibleProducts(PRODUCTS_PER_PAGE); }}
                        className={`store-tag-chip ${!selectedTag ? "active" : ""}`}>All</button>
                      {tags.map((tag) => (
                        <button key={tag}
                          onClick={() => { setSelectedTag(tag === selectedTag ? "" : tag); setVisibleProducts(PRODUCTS_PER_PAGE); }}
                          className={`store-tag-chip ${selectedTag === tag ? "active" : ""}`}>{tag}</button>
                      ))}
                    </div>
                  )}

                  {/* Products Grid */}
                  {filteredProducts.length === 0 ? (
                    <div className="store-empty-premium">
                      <div className="icon-wrap">{searchQuery || selectedTag ? "🔎" : "📦"}</div>
                      <h3>{searchQuery || selectedTag ? "No matching products" : "No products yet"}</h3>
                      <p>{searchQuery || selectedTag ? "Try adjusting your search or filter." : "This seller hasn't listed any products yet."}</p>
                      {(searchQuery || selectedTag) && (
                        <button onClick={() => { setSearchQuery(""); setSelectedTag(""); }}
                          className="mt-4 px-6 py-3 rounded-xl bg-[var(--brand-green)] text-white font-black hover:shadow-lg transition-all">
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="store-products-grid">
                        {paginatedProducts.map((product, index) => (
                          <div key={product._id} className="stagger-in" style={{ animationDelay: `${(index % 4) * 80}ms` }}>
                            <ProductCard product={product}
                              onAddToCart={handleAddToCart}
                              onToggleWishlist={toggleWishlist}
                              isInWishlist={wishlist.has(product._id)} />
                          </div>
                        ))}
                      </div>
                      {visibleProducts < filteredProducts.length && (
                        <div className="text-center mt-8">
                          <button onClick={() => setVisibleProducts(prev => prev + PRODUCTS_PER_PAGE)}
                            className="store-load-more">
                            Show More Products ({filteredProducts.length - visibleProducts} remaining)
                          </button>
                        </div>
                      )}
                      <p className="text-center text-xs text-[var(--text-muted)] mt-3">
                        Showing {Math.min(visibleProducts, filteredProducts.length)} of {filteredProducts.length} products
                      </p>
                    </>
                  )}
                </>
              )}
            </section>
          )}

          {/* ──── ABOUT TAB ──── */}
          {activeTab === "about" && (
            <section className="pb-16">
              <div className="store-about-grid">
                {/* Description */}
                <div className="store-about-card" style={{ gridColumn: seller.description ? "span 2" : undefined }}>
                  <h3>📖 About {seller.shop_name}</h3>
                  <p>{seller.description || "No description provided. This store is setting up their profile."}</p>
                </div>

                {/* Seller Info */}
                <div className="store-about-card">
                  <h3>👤 Store Details</h3>
                  <div className="info-row">
                    <span className="info-label">Shop Name</span>
                    <span className="info-value">{seller.shop_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Category</span>
                    <span className="info-value">{seller.category || "General"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">City</span>
                    <span className="info-value">{seller.city || "Not specified"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Member Since</span>
                    <span className="info-value">{formattedDate || "N/A"}</span>
                  </div>
                  {seller.phone && (
                    <div className="info-row">
                      <span className="info-label">Phone</span>
                      <span className="info-value">{seller.phone}</span>
                    </div>
                  )}
                  {seller.email && (
                    <div className="info-row">
                      <span className="info-label">Email</span>
                      <span className="info-value">{seller.email}</span>
                    </div>
                  )}
                </div>

                {/* Store Policies Summary */}
                <div className="store-about-card">
                  <h3>📋 Store Policies</h3>
                  {seller.shipping_policy ? (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-[var(--text-muted)] mb-1">Shipping</p>
                      <p>{seller.shipping_policy}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] italic">No shipping policy set</p>
                  )}
                  {seller.return_policy ? (
                    <div>
                      <p className="text-xs font-bold text-[var(--text-muted)] mb-1">Returns</p>
                      <p>{seller.return_policy}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] italic mt-2">No return policy set</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ──── REVIEWS TAB ──── */}
          {activeTab === "reviews" && (
            <section className="pb-16">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">
                    {reviews.length} {reviews.length === 1 ? "review" : "reviews"} for this store
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-reviews" className="text-xs font-bold text-[var(--text-muted)]">Sort:</label>
                  <select id="sort-reviews" value={reviewSort}
                    onChange={(e) => { setReviewSort(e.target.value); setVisibleReviews(REVIEWS_PER_PAGE); }}
                    className="store-sort-select">
                    {REVIEW_SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid lg:grid-cols-[1fr_380px] gap-8">
                <div>
                  {reviews.length > 0 && (
                    <div className="store-rating-summary mb-6">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-4xl font-black text-[var(--text-primary)]">{avgRating}</div>
                          <StarRating rating={Math.round(Number(avgRating))} size="sm" />
                          <div className="text-xs text-[var(--text-muted)] mt-1">{reviews.length} reviews</div>
                        </div>
                        <div className="flex-1">
                          <StarDistribution reviews={reviews} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <div className="store-empty-premium">
                        <div className="icon-wrap">💬</div>
                        <h3>No Reviews Yet</h3>
                        <p>Be the first one to review this store!</p>
                      </div>
                    ) : (
                      paginatedReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))
                    )}

                    {visibleReviews < sortedReviews.length && (
                      <div className="text-center mt-4">
                        <button onClick={() => setVisibleReviews(prev => prev + REVIEWS_PER_PAGE)}
                          className="store-load-more">
                          Show More Reviews ({sortedReviews.length - visibleReviews} remaining)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Write Review Form */}
                <div className="store-review-form-wrap">
                  <div className="store-review-form-inner">
                    <h3 className="font-black text-lg mb-1">Write a Review</h3>
                    <p className="text-xs text-[var(--text-muted)] mb-4">Share your experience with this store</p>
                    <form onSubmit={submitReview} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Your Rating</label>
                        <StarRating rating={reviewForm.rating} size="lg" interactive
                          onChange={(r) => setReviewForm({ ...reviewForm, rating: r })} />
                      </div>
                      <div>
                        <label htmlFor="review-comment" className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Your Review</label>
                        <textarea id="review-comment" className="store-textarea"
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          placeholder="What did you like? What could be improved?" rows={4} />
                      </div>
                      <button type="submit" disabled={submitting || !reviewForm.comment.trim()}
                        className="store-submit-review">
                        {submitting ? (
                          <span className="flex items-center gap-2 justify-center">
                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Submitting...
                          </span>
                        ) : "Submit Review"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ──── POLICIES TAB ──── */}
          {activeTab === "policies" && (
            <section className="pb-16">
              <div className="store-policies-row">
                <div className="store-policy-card">
                  <div className="icon">🚚</div>
                  <h4>Shipping Policy</h4>
                  <p>{seller.shipping_policy || "Standard shipping rates apply. Contact the store for specific shipping policies."}</p>
                </div>
                <div className="store-policy-card">
                  <div className="icon">↩️</div>
                  <h4>Return Policy</h4>
                  <p>{seller.return_policy || "Contact the store directly for return and refund policies."}</p>
                </div>
                <div className="store-policy-card">
                  <div className="icon">💬</div>
                  <h4>Contact Support</h4>
                  <p>Need help? {seller.phone || seller.email ? `Reach out via ${seller.phone || seller.email}.` : "Use the Contact button above to message the seller."}</p>
                </div>
                <div className="store-policy-card">
                  <div className="icon">🔒</div>
                  <h4>Secure Shopping</h4>
                  <p>All transactions on DR MART are secure. Your payment information is always protected.</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ═══════ BANNER FULLSCREEN MODAL ═══════ */}
      {bannerModal && seller.banner_url && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md"
          onClick={() => setBannerModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Full size banner image"
        >
          <button
            onClick={() => setBannerModal(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 text-white text-xl flex items-center justify-center hover:bg-white/20 transition-all z-[210]"
            aria-label="Close"
          >
            ✕
          </button>
          <img
            src={seller.banner_url}
            alt={seller.shop_name}
            className="max-w-[95vw] max-h-[90vh] rounded-xl object-contain shadow-2xl cursor-zoom-out"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
