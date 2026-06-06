"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { discountFor, money, moneyFromPaise, priceInPaise, ratingFor } from "@/lib/format";
import { StoreHeader, StatusPill, deliveryEstimate } from "@/components/StoreShell";
import { ProductDetailSkeleton } from "@/components/SkeletonLoaders";
import { useToast, ToastContainer } from "@/components/Toast";

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

function updateLocalList(key, item, idKey = "productId") {
  const current = JSON.parse(localStorage.getItem(key) || "[]");
  const existing = current.find((entry) => entry[idKey] === item[idKey]);
  const nextQuantity = Number(existing?.quantity || 0) + Number(item.quantity || 1);
  const nextItem = key === "commerce_cart" && existing
    ? { ...existing, ...item, quantity: Math.min(nextQuantity, Number(item.stock || nextQuantity)) }
    : item;
  const next = [nextItem, ...current.filter((entry) => entry[idKey] !== item[idKey])];
  localStorage.setItem(key, JSON.stringify(next));
  return next;
}

function buildSpecs(product) {
  return [
    ["Category", product.category],
    ["Seller SKU", product._id?.slice(-8).toUpperCase()],
    ["Stock", `${product.stock} units`],
    ["Material / Type", product.tags?.[0] || "Premium grade"],
    ["Warranty", "7 day replacement support"],
    ["Dispatch", product.stock > 0 ? "Ships from verified DR MART seller" : "Restock requested"],
  ];
}

function Stars({ value = 0, size = "text-lg" }) {
  const rating = Math.round(Number(value) || 0);
  return (
    <span className={`inline-flex ${size}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span className={star <= rating ? "text-[#d8942f]" : "text-[#d8cbbb]"} key={star}>★</span>
      ))}
    </span>
  );
}

export default function ProductPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [questions, setQuestions] = useState([]);
  const [question, setQuestion] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [status, setStatus] = useState("Loading product...");
  const [cart, setCart] = useState([]);
  const [saved, setSaved] = useState(false);
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, showToast, dismissToast } = useToast();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCart(JSON.parse(localStorage.getItem("commerce_cart") || "[]"));
      setSaved(JSON.parse(localStorage.getItem("dr_wishlist") || "[]").some((item) => item.productId === id));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    let active = true;
    async function load() {
      const productData = await api(`/api/products/${id}`);
      if (!active) return;
      setProduct(productData.product);
      setSelectedImage(productData.product.images?.[0]?.url || productData.product.image);
      setStatus("Ready");
      setIsLoading(false);
      updateLocalList("dr_recently_viewed", {
        productId: productData.product._id,
        title: productData.product.title,
        price: productData.product.price,
        priceInPaise: priceInPaise(productData.product),
        image: productData.product.image,
        category: productData.product.category,
      });
      const [relatedData, reviewData] = await Promise.all([
        api(`/api/products?category=${encodeURIComponent(productData.product.category)}`),
        api(`/api/reviews?productId=${id}`),
      ]);
      if (!active) return;
      setRelated(relatedData.products.filter((item) => item._id !== id).slice(0, 8));
      setReviews(reviewData.reviews);
      setCanReview(Boolean(reviewData.canReview));
    }
    load().catch((error) => active && setStatus(error.message));
    return () => {
      active = false;
    };
  }, [id]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0), [cart]);

  function addToCart(immediate = false) {
    if (!product || product.stock <= 0) {
      setStatus("This product is currently unavailable.");
      return;
    }

    const nextCart = updateLocalList("commerce_cart", {
      productId: product._id,
      title: product.title,
      price: product.price,
      priceInPaise: priceInPaise(product),
      image: product.image,
      stock: product.stock,
      quantity: 1,
    });
    setCart(nextCart);
    showToast("✓ Added to cart", "success");
    setStatus(immediate ? "Added to cart. Opening cart..." : "Added to cart.");
    if (immediate) {
      setBuyingNow(true);
      window.setTimeout(() => {
        setBuyingNow(false);
        router.push("/cart");
      }, 650);
    }
  }

  function addToWishlist() {
    if (!product) return;

    setSavingWishlist(true);
    setSaveFlash(false);
    updateLocalList("dr_wishlist", {
      productId: product._id,
      title: product.title,
      price: product.price,
      priceInPaise: priceInPaise(product),
      image: product.image,
      category: product.category,
      quantity: 1,
    });
    window.setTimeout(() => {
      setSaved(true);
      setSavingWishlist(false);
      setSaveFlash(true);
      showToast("♥ Saved to wishlist", "success");
      setStatus("Saved to wishlist.");
    }, 420);
  }

  async function submitReview(event) {
    event.preventDefault();
    if (!String(review.comment).trim()) {
      setStatus("Review comment is required.");
      return;
    }
    try {
      const data = await api("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ productId: product._id, ...review }),
      });
      setReviews([data.review, ...reviews]);
      setReview({ rating: 5, comment: "" });
      setStatus("Review added.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  function submitQuestion(event) {
    event.preventDefault();
    if (!question.trim()) {
      setStatus("Question is required.");
      return;
    }
    setQuestions([{ id: Date.now(), text: question.trim(), answer: "A verified seller will answer shortly." }, ...questions]);
    setQuestion("");
    setStatus("Question posted.");
  }

  if (!product) {
    return <main className="luxury-shell min-h-screen p-6 text-[#171412]">{status}</main>;
  }

  const discount = discountFor(product);
  const mrp = product.price / (1 - discount / 100);
  const gallery = product.images?.length ? product.images : [{ url: product.image, alt: product.title }];
  const specs = buildSpecs(product);
  const reviewAverageValue = reviews.length
    ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length
    : Number(ratingFor(product));
  const reviewAverage = Number.isFinite(reviewAverageValue) ? reviewAverageValue : 0;
  const outOfStock = product.stock <= 0;

  return (
    <main className="luxury-shell min-h-screen text-[var(--text-primary)]">
      <StoreHeader cartCount={cartCount} />

      {isLoading ? (
        <section className="mx-auto max-w-7xl px-4 py-6">
          <ProductDetailSkeleton />
        </section>
      ) : (
        <>
        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[460px_1fr_320px]">
        <div className="glass-panel rounded p-4">
          <div className="aspect-square rounded bg-[var(--surface-secondary)] p-5">
            <img alt={product.title} className="h-full w-full object-contain" src={selectedImage || product.image} />
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {gallery.map((image, index) => (
              <button className={`aspect-square rounded border bg-[var(--surface-primary)] p-1 ${selectedImage === image.url ? "border-[#123f3a]" : "border-[var(--border-primary)]"}`} key={`${image.url}-${index}`} onClick={() => setSelectedImage(image.url)} type="button">
                <img alt={image.alt || product.title} className="h-full w-full object-contain" src={image.url} />
              </button>
            ))}
          </div>
        </div>

        <section className="glass-panel rounded p-5">
          <nav className="mb-5 flex flex-wrap gap-2 text-sm font-black">
            <a className="rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]" href="#product-information">Product Information</a>
            <a className="rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]" href="#customer-reviews">Customer Reviews</a>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill>{product.category}</StatusPill>
            <StatusPill tone={outOfStock ? "rose" : "green"}>{outOfStock ? "Out of Stock" : "Available"}</StatusPill>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-normal md:text-5xl">{product.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded bg-[#123f3a] px-3 py-1 text-sm font-black text-white">{reviewAverage.toFixed(1)} / 5</span>
            <Stars value={reviewAverage} />
            <span className="text-sm font-bold text-[var(--text-muted)]">{reviews.length} reviews</span>
            <span className="text-sm font-bold text-[var(--text-muted)]">{questions.length} questions</span>
          </div>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <span className="text-4xl font-black">{money(product.price)}</span>
            <span className="text-lg text-[var(--text-muted)] line-through">{money(mrp)}</span>
            <span className="font-black text-[var(--text-accent)]">{discount}% off</span>
          </div>
          <p className="mt-5 max-w-3xl leading-7 text-[var(--text-secondary)]">{product.description}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4">
              <p className="text-xs font-black uppercase text-[var(--text-muted)]">Seller profile</p>
              <h2 className="mt-1 text-xl font-black">DR MART Verified Studio</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Ships authenticated inventory with quality checks, careful packaging, and responsive support.</p>
            </div>
            <div className="rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4">
              <p className="text-xs font-black uppercase text-[var(--text-muted)]">Delivery estimate</p>
              <h2 className="mt-1 text-xl font-black">{deliveryEstimate(product.stock)}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Stock status: {product.stock > 0 ? `${product.stock} units ready` : "unavailable"}.</p>
            </div>
          </div>

          <div className="mt-6 scroll-mt-24" id="product-information">
            <h2 className="text-xl font-black">Specifications</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {specs.map(([label, value]) => (
                <div className="rounded bg-[var(--surface-secondary)] p-3" key={label}>
                  <p className="text-xs font-bold uppercase text-[var(--text-muted)]">{label}</p>
                  <p className="font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="glass-panel rounded p-5">
          <p className="text-3xl font-black">{money(product.price)}</p>
          <p className="mt-2 text-sm font-bold text-[var(--text-accent)]">{deliveryEstimate(product.stock)}</p>
          {outOfStock ? <p className="mt-4 rounded bg-red-50 p-3 text-sm font-black text-red-700">Out of Stock</p> : null}
          <button className="mt-5 w-full rounded bg-[#123f3a] px-4 py-3 font-black text-white hover:bg-[#1d6b62] disabled:cursor-not-allowed disabled:bg-slate-300" disabled={outOfStock} onClick={() => addToCart(false)} type="button">Add to Cart</button>
          <button
            className={`buy-now-btn mt-3 w-full rounded px-4 py-3 font-black transition-all duration-150
              ${outOfStock
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : buyingNow
                  ? "scale-[0.97] bg-[#d8a84a] text-[#123f3a] shadow-inner"
                  : "bg-[#f4d7a1] text-[#123f3a] hover:bg-[#edc97a] hover:shadow-md active:scale-[0.97] active:bg-[#d8a84a] active:shadow-inner"
              }`}
            disabled={outOfStock || buyingNow}
            onClick={() => addToCart(true)}
            type="button"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {buyingNow ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#123f3a] border-t-transparent" />
                  Processing…
                </>
              ) : (
                "Buy Now"
              )}
            </span>
          </button>
          <button
            className={`mt-3 w-full rounded border px-4 py-3 font-black transition ${saved ? "border-[var(--border-primary)] bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]" : "border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"} ${savingWishlist ? "scale-[0.98]" : ""}`}
            disabled={savingWishlist}
            onClick={addToWishlist}
            type="button"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {savingWishlist ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
              {savingWishlist ? "Saving..." : saved ? "Saved to Wishlist" : "Save"}
            </span>
          </button>
          {saveFlash ? (
            <p className="mt-3 rounded bg-[var(--badge-green-bg)] px-3 py-2 text-sm font-black text-[var(--badge-green-text)]">
              Saved successfully. Find it anytime in your wishlist.
            </p>
          ) : null}
          <p className="mt-4 rounded bg-[var(--surface-secondary)] p-3 text-sm font-bold text-[var(--text-secondary)]">{status}</p>
        </aside>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="glass-panel rounded p-5">
            <h2 className="text-2xl font-black">Related & recommended products</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <Link className="rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] p-3 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between" href={`/product/${item._id}`} key={item._id}>
                  <div className="h-28 w-full overflow-hidden rounded bg-[var(--surface-secondary)] p-2 flex items-center justify-center mb-2">
                    <img alt={item.title} className="h-full w-full object-contain" src={item.image} />
                  </div>
                  <div>
                    <p className="line-clamp-2 text-sm font-black">{item.title}</p>
                    <p className="text-sm font-black text-[var(--text-accent)] mt-1">{moneyFromPaise(priceInPaise(item))}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded p-5">
            <h2 className="text-2xl font-black">Customer Q&A</h2>
            <form className="mt-4 flex gap-2" onSubmit={submitQuestion}>
              <input className="min-w-0 flex-1 rounded border border-[var(--border-secondary)] px-3 py-2" onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about fit, warranty, delivery..." value={question} />
              <button className="rounded bg-[#123f3a] px-4 py-2 font-black text-white" type="submit">Ask</button>
            </form>
            <div className="mt-4 space-y-3">
              {[{ id: "default", text: "Is this product eligible for replacement?", answer: "Yes, verified seller replacement support is available for eligible orders." }, ...questions].map((item) => (
                <div className="rounded bg-[var(--surface-primary)] border border-[var(--border-primary)] p-3" key={item.id}>
                  <p className="font-black">Q: {item.text}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">A: {item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="glass-panel scroll-mt-24 rounded p-5" id="customer-reviews">
          <div className="rounded bg-[var(--surface-primary)] border border-[var(--border-primary)] p-4">
            <p className="text-xs font-black uppercase text-[var(--text-muted)]">Customer rating</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-4xl font-black">{reviewAverage.toFixed(1)}</span>
              <div>
                <Stars value={reviewAverage} size="text-2xl" />
                <p className="text-sm font-bold text-[var(--text-muted)]">{reviews.length} verified reviews</p>
              </div>
            </div>
          </div>
          <form className="mt-4 space-y-3 rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4" onSubmit={submitReview}>
            <p className="text-sm font-black text-[var(--text-secondary)]">Rate this delivered product</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  className={`text-3xl leading-none ${value <= Number(review.rating) ? "text-[#d8942f]" : "text-[#d8cbbb]"}`}
                  disabled={!canReview}
                  key={value}
                  onClick={() => setReview({ ...review, rating: value })}
                  type="button"
                >
                  ★
                </button>
              ))}
            </div>
            <textarea className="min-h-24 w-full rounded border border-[var(--border-secondary)] p-2 disabled:bg-slate-100" disabled={!canReview} onChange={(event) => setReview({ ...review, comment: event.target.value })} placeholder={canReview ? "Write a review" : "Reviews open after your paid order is delivered."} value={review.comment} />
            <button className="rounded bg-[#123f3a] px-4 py-2 font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!canReview} type="submit">Submit Review</button>
          </form>
          <div className="mt-5 space-y-3">
            {reviews.length ? reviews.map((item) => (
              <div className="rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4" key={item._id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black">{item.userName}</p>
                  <Stars value={item.rating} />
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.comment}</p>
              </div>
            )) : <p className="rounded bg-[var(--surface-primary)] border border-[var(--border-primary)] p-3 text-sm text-[var(--text-muted)]">No reviews yet.</p>}
          </div>
        </section>
      </section>
        </>
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
