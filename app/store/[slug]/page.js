"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { StoreHeader, StatusPill, deliveryEstimate } from "@/components/StoreShell";
import { useToast, ToastContainer } from "@/components/Toast";

export default function StorePage() {
  const params = useParams();
  const slug = params?.slug;
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      try {
        const sellersData = await api(`/api/sellers?slug=${encodeURIComponent(slug)}`);
        if (cancelled) return;
        const sellersList = Array.isArray(sellersData.sellers) ? sellersData.sellers : [];
        if (!sellersList.length) {
          setLoading(false);
          return;
        }
        const sellerData = sellersList[0];
        setSeller(sellerData);

        // Load products
        try {
          const allProducts = await api("/api/products?ai=true&limit=50");
          if (!cancelled) setProducts(Array.isArray(allProducts.products) ? allProducts.products : []);
        } catch (e) {}

        // Check if user is following
        try {
          const userData = await api("/api/auth/me");
          if (!cancelled) setUser(userData.user);
          if (userData.user) {
            const followingData = await api("/api/sellers/follow");
            if (!cancelled) {
              const isFollowing = followingData.following?.some(f => String(f.seller_id) === String(sellerData.id));
              setFollowing(isFollowing);
            }
          }
        } catch (e) {}

        // Load reviews
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
  }, [slug]);

  async function toggleFollow() {
    if (!user) return showToast("Sign in to follow", "warn");
    try {
      const data = await api("/api/sellers/follow", { method: "POST", body: JSON.stringify({ sellerId: seller.id }) });
      setFollowing(data.following);
      showToast(data.following ? "Following!" : "Unfollowed", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function submitReview(event) {
    event.preventDefault();
    if (!user) return showToast("Sign in to review", "warn");
    setSubmitting(true);
    try {
      await api("/api/sellers/reviews", { method: "POST", body: JSON.stringify({ sellerId: seller.id, ...reviewForm }) });
      showToast("Review submitted!", "success");
      setReviewForm({ rating: 5, comment: "" });
      const reviewsData = await api(`/api/sellers/reviews?sellerId=${seller.id}`);
      setReviews(reviewsData.reviews || []);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!slug || loading) return (
    <div className="luxury-shell min-h-screen">
      <StoreHeader />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--brand-green)] border-t-transparent mx-auto" />
          <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">Loading store...</p>
        </div>
      </div>
    </div>
  );

  if (!seller) return (
    <div className="luxury-shell min-h-screen">
      <StoreHeader />
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-black mb-2">Store Not Found</h1>
        <p className="text-[var(--text-muted)] mb-6">This store doesn't exist or has been removed.</p>
        <Link href="/" className="inline-block btn-primary px-6 py-3 rounded-lg font-black">Browse Products</Link>
      </div>
    </div>
  );

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

  return (
    <div className="luxury-shell min-h-screen">
      <StoreHeader />

      {seller.announcement_banner && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3 text-center">
          <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">📢 {seller.announcement_banner}</p>
        </div>
      )}

      <div className="relative overflow-hidden bg-[var(--brand-green)] text-white">
        {seller.banner_url && (
          <div className="absolute inset-0 opacity-20">
            <img src={seller.banner_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-16">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {seller.logo_url ? (
                <img src={seller.logo_url} alt={seller.shop_name} className="h-full w-full object-contain p-2" />
              ) : (
                <span className="text-5xl">🏪</span>
              )}
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl md:text-5xl font-black">{seller.shop_name}</h1>
                {seller.verification_badge && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-sm font-bold text-blue-300">
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="mt-2 text-white/80 max-w-2xl">{seller.description || "Premium store on DR MART"}</p>
              <div className="flex flex-wrap items-center gap-4 mt-4 justify-center md:justify-start">
                <span className="text-sm font-bold text-[var(--brand-gold)]">⭐ {avgRating} ({reviews.length} reviews)</span>
                <span className="text-sm text-white/60">•</span>
                <span className="text-sm text-white/60">{seller.followers_count || 0} followers</span>
                {seller.city && (
                  <><span className="text-sm text-white/60">•</span><span className="text-sm text-white/60">{seller.city}</span></>
                )}
              </div>
              <div className="flex gap-3 mt-5 justify-center md:justify-start">
                <button onClick={toggleFollow} className={`px-6 py-2.5 rounded-lg font-black text-sm transition-all ${following ? "bg-white/20 text-white border border-white/30" : "bg-[var(--brand-gold)] text-[var(--brand-ink)]"}`}>
                  {following ? "✓ Following" : "Follow Store"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-12">
          <h2 className="text-2xl font-black mb-6">Products from this Store</h2>
          {seller.vacation_mode ? (
            <div className="glass-panel rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">⏸️</div>
              <p className="font-bold text-[var(--text-muted)]">This store is currently on vacation. Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.length === 0 ? (
                <div className="col-span-full glass-panel rounded-xl p-8 text-center">
                  <p className="font-bold text-[var(--text-muted)]">No products listed yet.</p>
                </div>
              ) : (
                (Array.isArray(products) ? products : []).slice(0, 8).map((product) => (
                  <Link key={product._id} href={`/product/${product._id}`} className="glass-panel rounded-xl p-3 hover:-translate-y-1 transition-all group">
                    <div className="aspect-square rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center p-3 mb-3 overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.title} className="h-full w-full object-contain group-hover:scale-105 transition-transform" />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                    </div>
                    <p className="font-bold text-sm line-clamp-2">{product.title}</p>
                    <p className="text-lg font-black text-[var(--brand-green)] mt-1">{money(product.price)}</p>
                    <p className="text-xs text-[var(--text-muted)]">{deliveryEstimate(product.stock)}</p>
                  </Link>
                ))
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-black mb-6">Customer Reviews</h2>
          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="glass-panel rounded-xl p-6 text-center">
                  <p className="font-bold text-[var(--text-muted)]">No reviews yet. Be the first!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="glass-panel rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{review.buyer_name || "Customer"}</span>
                        <span className="text-xs text-[var(--text-muted)]">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="font-bold text-sm text-[var(--brand-gold)]">{'⭐'.repeat(review.rating)}</span>
                    </div>
                    {review.comment && <p className="text-sm text-[var(--text-secondary)]">{review.comment}</p>}
                  </div>
                ))
              )}
            </div>

            <div className="glass-panel rounded-xl p-5 h-fit sticky top-6">
              <h3 className="font-black mb-4">Write a Review</h3>
              <form onSubmit={submitReview} className="space-y-3">
                <div className="flex gap-2">
                  {[1,2,3,4,5].map((star) => (
                    <button key={star} type="button" onClick={() => setReviewForm({...reviewForm, rating: star})} className={`text-2xl transition-all ${star <= reviewForm.rating ? "text-yellow-500 scale-110" : "text-gray-300"}`}>
                      ★
                    </button>
                  ))}
                </div>
                <textarea className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm min-h-24" value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} placeholder="Share your experience..." />
                <button type="submit" disabled={submitting} className="w-full btn-primary px-4 py-2.5 rounded-lg font-black text-sm disabled:opacity-50">
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}