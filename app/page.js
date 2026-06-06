"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { discountFor, money, moneyFromPaise, priceInPaise, ratingFor } from "@/lib/format";
import { StoreHeader, StatusPill, deliveryEstimate } from "@/components/StoreShell";
import { useToast, ToastContainer } from "@/components/Toast";
import EmptyState from "@/components/EmptyState";
import { ProductGridSkeleton } from "@/components/SkeletonLoaders";

function ripple(event) {
  const btn = event.currentTarget;
  const dot = document.createElement("span");
  const rect = btn.getBoundingClientRect();
  dot.className = "btn-ripple-dot";
  dot.style.top = `${event.clientY - rect.top}px`;
  dot.style.left = `${event.clientX - rect.left}px`;
  btn.appendChild(dot);
  dot.addEventListener("animationend", () => dot.remove());
}

const shippingDefaults = {
  name: "",
  line1: "",
  city: "",
  country: "India",
  phone: "",
  pincode: "",
};

const categoriesSeed = ["Mobiles", "Fashion", "Electronics", "Home", "Footwear", "Appliances", "Beauty", "Toys", "Accessories"];

function loadRazorpayCheckout() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout"));
    document.body.appendChild(script);
  });
}

function cartItem(product) {
  return {
    productId: product._id,
    title: product.title,
    price: product.price,
    priceInPaise: priceInPaise(product),
    image: product.image,
    stock: product.stock,
    quantity: 1,
  };
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [shipping, setShipping] = useState(shippingDefaults);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("featured");
  const [priceBand, setPriceBand] = useState("all");
  const [stockOnly, setStockOnly] = useState(false);
  const [status, setStatus] = useState("Loading curated products...");
  const [busy, setBusy] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [savingProductId, setSavingProductId] = useState("");
  const [removingProductId, setRemovingProductId] = useState("");
  const [cartAddedId, setCartAddedId] = useState("");
  const [buyNowId, setBuyNowId] = useState("");
  const [savedProductIds, setSavedProductIds] = useState([]);
  const [saveNotice, setSaveNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const { toasts, showToast, dismissToast } = useToast();
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + priceInPaise(item) * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const categories = useMemo(() => {
    const fromProducts = products.map((product) => product.category).filter(Boolean);
    return Array.from(new Set([...categoriesSeed, ...fromProducts])).sort();
  }, [products]);

  const visibleProducts = useMemo(() => {
    const filtered = products
      .filter((product) => (stockOnly ? product.stock > 0 : true))
      .filter((product) => {
        if (priceBand === "all") return true;
        if (priceBand === "under5") return product.price < 5000;
        if (priceBand === "5to15") return product.price >= 5000 && product.price <= 15000;
        return product.price > 15000;
      });

    return [...filtered].sort((a, b) => {
      if (sort === "priceAsc") return a.price - b.price;
      if (sort === "priceDesc") return b.price - a.price;
      if (sort === "rating") return ratingFor(b) - ratingFor(a);
      if (sort === "stock") return b.stock - a.stock;
      return discountFor(b) - discountFor(a);
    });
  }, [products, priceBand, sort, stockOnly]);

  const recommended = useMemo(() => visibleProducts.filter((product) => ratingFor(product) >= 4.2).slice(0, 4), [visibleProducts]);

  async function loadProducts(nextQuery = query, nextCategory = category) {
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextCategory) params.set("category", nextCategory);
    params.set("ai", "true");
    const data = await api(`/api/products?${params}`);
    setProducts(data.products);
    setStatus(`${data.products.length} products matched your selection.`);
  }

  async function loadUserAndOrders() {
    const userData = await api("/api/auth/me");
    setUser(userData.user);
    if (userData.user) {
      const orderData = await api("/api/orders");
      setOrders(orderData.orders);
    }
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [productData, userData] = await Promise.all([api("/api/products?ai=true"), api("/api/auth/me")]);
        if (!active) return;
        setProducts(productData.products);
        setUser(userData.user);
        setStatus(`${productData.products.length} products ready.`);
        setIsLoading(false);
        if (userData.user) {
          const orderData = await api("/api/orders");
          if (active) setOrders(orderData.orders);
        }
      } catch (error) {
        if (active) setStatus(error.message);
      }
    }
    load();
    const interval = setInterval(async () => {
      if (active) {
        try {
          const userData = await api("/api/auth/me");
          if (userData.user && active) {
            const orderData = await api("/api/orders");
            if (active) setOrders(orderData.orders);
          }
        } catch (error) {
          console.error("Order poll failed:", error);
        }
      }
    }, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCart(JSON.parse(localStorage.getItem("commerce_cart") || "[]"));
      setSavedProductIds(JSON.parse(localStorage.getItem("dr_wishlist") || "[]").map((item) => item.productId));
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("commerce_cart", JSON.stringify(cart));
  }, [cart, mounted]);

  function addToCart(product, immediate = false) {
    if (product.stock <= 0) {
      showToast(`${product.title} is out of stock`, "warn");
      setStatus(`${product.title} is Out of Stock.`);
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.productId === product._id);
      if (existing && existing.quantity >= product.stock) {
        showToast(`${product.title} has only ${product.stock} units available`, "warn");
        setStatus(`${product.title} has only ${product.stock} units available.`);
        return current;
      }
      const next = existing
        ? current.map((item) => (item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item))
        : [cartItem(product), ...current];
      return next;
    });
    showToast("✓ Added to cart", "success");
    setStatus(immediate ? "Item added. Complete checkout on the right." : "Added to cart.");
    if (!immediate) {
      setCartAddedId(product._id);
      window.setTimeout(() => setCartAddedId(""), 900);
    }
  }

  function toggleWishlist(product) {
    const current = JSON.parse(localStorage.getItem("dr_wishlist") || "[]");
    const alreadySaved = savedProductIds.includes(product._id);
    setSaveNotice("");

    if (alreadySaved) {
      // Remove from wishlist
      setRemovingProductId(product._id);
      const updated = current.filter((entry) => entry.productId !== product._id);
      localStorage.setItem("dr_wishlist", JSON.stringify(updated));
      window.setTimeout(() => {
        setSavedProductIds((ids) => ids.filter((id) => id !== product._id));
        setRemovingProductId("");
        setSaveNotice(`${product.title} removed from wishlist.`);
        showToast("Removed from wishlist", "info");
        setStatus("Removed from wishlist.");
      }, 420);
    } else {
      // Add to wishlist
      setSavingProductId(product._id);
      const item = { ...cartItem(product), category: product.category };
      localStorage.setItem("dr_wishlist", JSON.stringify([item, ...current.filter((entry) => entry.productId !== product._id)]));
      window.setTimeout(() => {
        setSavedProductIds((ids) => Array.from(new Set([product._id, ...ids])));
        setSavingProductId("");
        setSaveNotice(`${product.title} saved to wishlist.`);
        showToast("♥ Saved to wishlist", "success");
        setStatus("Saved to wishlist.");
      }, 420);
    }
  }

  function updateCart(productId, quantity) {
    setCart((current) => current.map((item) => (item.productId === productId ? { ...item, quantity } : item)).filter((item) => item.quantity > 0));
  }

  async function fetchPincodeDetails(pincode) {
    if (!pincode || !/^[0-9]{6}$/.test(pincode.replace(/\D/g, ""))) return;
    
    try {
      const response = await api(`/api/pincode?pincode=${pincode}`);
      if (response.status === "success" && response.data) {
        setShipping(prev => ({
          ...prev,
          city: response.data.city || prev.city,
        }));
      }
    } catch (error) {
      console.error("Pincode lookup failed:", error);
    }
  }

  function validateCheckout() {
    const errors = {};
    ["name", "line1", "city", "phone", "pincode"].forEach((key) => {
      if (!String(shipping[key] || "").trim()) errors[key] = "Required";
    });
    if (shipping.phone && !/^[0-9]{10}$/.test(shipping.phone.replace(/\D/g, ""))) errors.phone = "Mobile must be 10 digits";
    if (shipping.pincode && !/^[0-9]{6}$/.test(shipping.pincode.replace(/\D/g, ""))) errors.pincode = "PIN must be 6 digits";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function seedProducts() {
    setBusy(true);
    try {
      const data = await api("/api/seed");
      await loadProducts("", "");
      setStatus(`${data.count} products seeded.`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function search(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await loadProducts(query, category);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function chooseCategory(nextCategory) {
    setCategory(nextCategory);
    setQuery("");
    setBusy(true);
    try {
      await loadProducts("", nextCategory);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function checkout(event) {
    event.preventDefault();
    if (!cart.length) return setStatus("Add products to cart first.");
    if (!user) return setStatus("Sign in before checkout.");
    if (!validateCheckout()) return setStatus("Complete the required delivery fields.");

    setBusy(true);
    try {
      const data = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({ items: cart, shippingAddress: shipping }),
      });
      const payment = await api("/api/payments/razorpay", {
        method: "POST",
        body: JSON.stringify({ orderId: data.order._id }),
      });
      await loadRazorpayCheckout();
      const success = await new Promise((resolve, reject) => {
        const checkoutPopup = new window.Razorpay({
          key: payment.keyId,
          amount: payment.amountInPaise,
          currency: payment.currency,
          name: "DR MART",
          description: `Order #${payment.localOrderId.slice(-6)}`,
          order_id: payment.razorpayOrderId,
          prefill: { name: payment.name || shipping.name, email: payment.email },
          notes: { localOrderId: payment.localOrderId },
          theme: { color: "#123f3a" },
          handler: async (response) => {
            try {
              const confirmation = await api("/api/payments/razorpay", {
                method: "PUT",
                body: JSON.stringify({ localOrderId: payment.localOrderId, ...response }),
              });
              resolve(confirmation);
            } catch (error) {
              reject(error);
            }
          },
          modal: { ondismiss: () => resolve(false) },
        });
        checkoutPopup.open();
      });
      if (success) {
        setCart([]);
        setShipping(shippingDefaults);
        await loadUserAndOrders();
        const receiptStatus = success.order?.payment?.receiptEmailStatus;
        setStatus(receiptStatus === "sent"
          ? "Payment complete. Receipt emailed to the customer."
          : "Payment complete. Order confirmed.");
      } else {
        await loadUserAndOrders();
        setStatus("Order created. Payment is pending.");
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="luxury-shell min-h-screen text-[var(--text-primary)]">
      <StoreHeader cartCount={cartCount} user={user} />

      <section className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="brand-gradient animate-rise overflow-hidden rounded p-6 text-white shadow-xl md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <StatusPill tone="gold">Independent premium marketplace</StatusPill>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-normal md:text-6xl">Curated everyday luxury, delivered with quiet confidence.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#f6efe4]">DR MART by DR Group brings refined products, verified sellers, intelligent discovery, secure Razorpay checkout, and transparent order tracking into one calm shopping experience.</p>
              <form className="mt-6 grid gap-2 rounded bg-white/12 p-2 md:grid-cols-[150px_1fr_auto]" onSubmit={search}>
                <select className="rounded border border-[var(--border-secondary)] bg-[var(--input-bg)] px-3 py-3 text-sm font-bold text-[var(--text-primary)]" onChange={(event) => setCategory(event.target.value)} value={category}>
                  <option value="">All categories</option>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <input className="rounded border border-[var(--border-secondary)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Search handcrafted bags, phones, appliances..." value={query} />
                <button className="btn-gold px-5 py-3 text-sm disabled:opacity-60" disabled={busy} onClick={ripple} type="submit">Search</button>
              </form>
            </div>
            <div className="rounded border border-white/20 bg-white/12 p-5">
              <p className="text-sm font-bold text-[#f4d7a1]">Today’s collection</p>
              <p className="mt-2 text-3xl font-black">{visibleProducts.length} pieces</p>
              <p className="mt-2 text-sm text-[#f6efe4]">Sorted by quality signals, stock confidence, seller reliability, and savings.</p>
              <button className="btn-ghost mt-5 px-4 py-2 text-sm" onClick={(e) => { ripple(e); seedProducts(); }} type="button">Load demo catalog</button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[260px_1fr_330px]">
          <aside className="space-y-4">
            <section className="glass-panel rounded p-4">
              <h2 className="font-black">Explore</h2>
              <div className="mt-3 grid gap-2">
                <button className={`btn-category px-3 py-2 text-left text-sm font-bold ${!category ? "bg-[var(--brand-green)] text-white active" : "hover:bg-[var(--surface-secondary)]"}`} onClick={(e) => { ripple(e); chooseCategory(""); }} type="button">All products</button>
                {categories.map((item) => (
                  <button className={`btn-category px-3 py-2 text-left text-sm ${category === item ? "bg-[var(--brand-green)] font-bold text-white active" : "hover:bg-[var(--surface-secondary)]"}`} key={item} onClick={(e) => { ripple(e); chooseCategory(item); }} type="button">{item}</button>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded p-4">
              <h2 className="font-black">Filters</h2>
              <div className="mt-3 space-y-3">
                <label className="block text-sm font-bold">Price</label>
                <select className="w-full rounded border border-[var(--border-secondary)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]" onChange={(event) => setPriceBand(event.target.value)} value={priceBand}>
                  <option value="all">All prices</option>
                  <option value="under5">Under ₹5,000</option>
                  <option value="5to15">₹5,000 to ₹15,000</option>
                  <option value="above15">Above ₹15,000</option>
                </select>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input checked={stockOnly} onChange={(event) => setStockOnly(event.target.checked)} type="checkbox" />
                  In-stock only
                </label>
                <label className="block text-sm font-bold">Sort</label>
                <select className="w-full rounded border border-[var(--border-secondary)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]" onChange={(event) => setSort(event.target.value)} value={sort}>
                  <option value="featured">Featured savings</option>
                  <option value="rating">Highest rated</option>
                  <option value="priceAsc">Price: low to high</option>
                  <option value="priceDesc">Price: high to low</option>
                  <option value="stock">Stock confidence</option>
                </select>
              </div>
            </section>
          </aside>

          <div className="space-y-5">
            <section className="grid gap-3 md:grid-cols-3">
              {["Verified sellers", "Razorpay protected", "Easy order tracking"].map((text) => (
                <div className="glass-panel rounded p-4" key={text}>
                  <p className="text-xs font-bold uppercase text-[#7c6a55]">DR MART standard</p>
                  <p className="mt-1 text-lg font-black">{text}</p>
                </div>
              ))}
            </section>

            <section className="glass-panel rounded p-4">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border-primary)] pb-4">
                <div>
                  <h2 className="text-xl font-black">All Catalog Items</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{status}</p>
                  {saveNotice ? <p className="mt-2 rounded bg-[var(--badge-green-bg)] px-3 py-2 text-sm font-black text-[var(--badge-green-text)]">{saveNotice}</p> : null}
                </div>
                <StatusPill>{visibleProducts.length} results</StatusPill>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {isLoading ? (
                  <ProductGridSkeleton count={6} />
                ) : visibleProducts.length > 0 ? visibleProducts.map((product, index) => {
                  const discount = discountFor(product);
                  const mrp = product.price / (1 - discount / 100);
                  const isSaving = savingProductId === product._id;
                  const isRemoving = removingProductId === product._id;
                  const isSaved = savedProductIds.includes(product._id);
                  const isCartAdded = cartAddedId === product._id;
                  return (
                    <article className="animate-rise group rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] p-3 hover:-translate-y-1 hover:shadow-xl" key={product._id} style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
                      <Link href={`/product/${product._id}`}>
                        <div className="relative aspect-square overflow-hidden rounded bg-[var(--surface-secondary)]">
                          <StatusPill tone={product.stock > 0 ? "green" : "rose"}>{product.stock > 0 ? "In stock" : "Out of Stock"}</StatusPill>
                          {product.image ? <img alt={product.title} className="h-full w-full object-contain p-5 group-hover:scale-105" src={product.image} /> : null}
                        </div>
                      </Link>
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-black uppercase text-[var(--text-accent)]">{product.category}</p>
                        <Link href={`/product/${product._id}`}><h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 hover:text-[var(--text-accent)]">{product.title}</h3></Link>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black">{ratingFor(product)} / 5</span>
                          <span className="text-xs text-[var(--text-muted)]">{deliveryEstimate(product.stock)}</span>
                        </div>
                        <div>
                          <span className="text-xl font-black">{money(product.price)}</span>
                          <span className="ml-2 text-xs text-[var(--text-muted)] line-through">{money(mrp)}</span>
                          <p className="text-xs font-bold text-[var(--text-accent)]">{discount}% off</p>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          {/* ── Add to Cart ── */}
                          <button
                            className={`btn-primary btn-cart px-3 py-2 text-xs disabled:cursor-not-allowed disabled:bg-slate-300 ${isCartAdded ? "btn-cart-success" : ""}`}
                            disabled={product.stock <= 0}
                            onClick={(e) => { ripple(e); addToCart(product); }}
                            type="button"
                          >
                            <span className="inline-flex items-center justify-center gap-1">
                              {isCartAdded ? (
                                <span className="btn-check-icon">✓</span>
                              ) : (
                                <span className="btn-cart-icon">🛒</span>
                              )}
                              {isCartAdded ? "Added!" : "Add to cart"}
                            </span>
                          </button>
                          {/* isBuyNow derived */}
                          {(() => { const isBuyNow = buyNowId === product._id; return null; })()}

                          {/* ── Save / Wishlist ── */}
                          <button
                            className={`btn-save min-w-16 border px-3 py-2 text-xs group/save ${
                              isSaved
                                ? "btn-save-saved border-[var(--brand-green-bright)] bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] hover:border-[var(--badge-rose-text)] hover:bg-[var(--badge-rose-bg)] hover:text-[var(--badge-rose-text)]"
                                : "border-[var(--brand-gold)] text-[var(--brand-gold)] hover:bg-[var(--badge-gold-bg)]"
                            } ${(isSaving || isRemoving) ? "scale-95" : ""}`}
                            disabled={isSaving || isRemoving}
                            onClick={(e) => { ripple(e); toggleWishlist(product); }}
                            type="button"
                          >
                            <span className="inline-flex items-center gap-1">
                              {(isSaving || isRemoving)
                                ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                : <span className={`btn-heart-icon ${isSaved ? "btn-heart-saved" : ""}`}>{isSaved ? "♥" : "♡"}</span>
                              }
                              {isSaving ? "Saving…" : isRemoving ? "Removing…" : isSaved
                                ? <><span className="group-hover/save:hidden">Saved</span><span className="hidden group-hover/save:inline">Unsave</span></>
                                : "Save"
                              }
                            </span>
                          </button>
                        </div>

                        {/* ── Buy Now ── */}
                        {(function BuyNowBtn() {
                          const isBuyNow = buyNowId === product._id;
                          return (
                            <button
                              className={`btn-buynow w-full px-3 py-2 text-xs disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 ${isBuyNow ? "btn-buynow-success" : "btn-gold"}`}
                              disabled={product.stock <= 0}
                              onClick={(e) => {
                                ripple(e);
                                addToCart(product, true);
                                setBuyNowId(product._id);
                                window.setTimeout(() => setBuyNowId(""), 1000);
                              }}
                              type="button"
                            >
                              <span className="inline-flex items-center justify-center gap-1">
                                {isBuyNow
                                  ? <span className="btn-check-icon">✓</span>
                                  : <span className="btn-bolt-icon">⚡</span>
                                }
                                {isBuyNow ? "Added to cart!" : "Buy now"}
                              </span>
                            </button>
                          );
                        })()}
                      </div>
                    </article>
                  );
                }) : <EmptyState icon="🔍" title="No products found" description="Try adjusting your search or filters to find what you're looking for." actionLabel="Browse all" actionHref="/" />}
              </div>
            </section>

            <section className="glass-panel rounded p-4">
              <h2 className="text-xl font-black">Recommended for you</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {recommended.map((product) => (
                  <Link className="rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] p-3 hover:-translate-y-1 flex flex-col justify-between" href={`/product/${product._id}`} key={product._id}>
                    <div className="h-28 w-full overflow-hidden rounded bg-[var(--surface-secondary)] p-2 flex items-center justify-center">
                      <img alt={product.title} className="h-full w-full object-contain" src={product.image} />
                    </div>
                    <div className="mt-2">
                      <p className="line-clamp-2 text-sm font-black">{product.title}</p>
                      <p className="text-sm font-black text-[var(--text-accent)] mt-1">{moneyFromPaise(priceInPaise(product))}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="glass-panel rounded p-4">
              <h2 className="text-xl font-black">Checkout</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{cartCount} items · {moneyFromPaise(cartTotal)}</p>
              <div className="mt-4 max-h-56 space-y-3 overflow-auto">
                {cart.length ? cart.map((item) => (
                  <div className="flex gap-3 border-b border-[var(--border-primary)] pb-3" key={item.productId}>
                    <img alt={item.title} className="h-14 w-14 rounded object-contain" src={item.image} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">{item.title}</p>
                      <p className="text-sm text-[var(--text-muted)]">{moneyFromPaise(priceInPaise(item))}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <button className="h-7 w-7 rounded border" onClick={() => updateCart(item.productId, item.quantity - 1)} type="button">-</button>
                        <span className="text-sm font-black">{item.quantity}</span>
                        <button className="h-7 w-7 rounded border" onClick={() => updateCart(item.productId, item.quantity + 1)} type="button">+</button>
                      </div>
                    </div>
                  </div>
                )) : <p className="rounded bg-[var(--surface-secondary)] p-3 text-sm text-[var(--text-muted)]">Your cart is waiting.</p>}
              </div>
              <form className="mt-4 space-y-2" onSubmit={checkout}>
                {Object.keys(shippingDefaults).map((key) => (
                  <label className="block" key={key}>
                    <input 
                      className={`w-full rounded border px-3 py-2 text-sm bg-[var(--input-bg)] text-[var(--text-primary)] ${formErrors[key] ? "border-red-500" : "border-[var(--border-secondary)]"}`} 
                      onChange={(event) => { const val = event.target.value; setShipping({ ...shipping, [key]: val }); if (key === "pincode" && val.length === 6) fetchPincodeDetails(val); }} 
                      placeholder={key === "line1" ? "Delivery address *" : `${key[0].toUpperCase() + key.slice(1)}${["name", "city", "phone", "pincode"].includes(key) ? " *" : ""}`}
                      value={shipping[key]}
                      {...(key === "phone" ? { maxLength: 10, inputMode: "numeric", onInput: (e) => e.target.value = e.target.value.replace(/[^0-9]/g, "") } : {})}
                      {...(key === "pincode" ? { maxLength: 6, inputMode: "numeric", onInput: (e) => e.target.value = e.target.value.replace(/[^0-9]/g, "") } : {})}
                    />
                    {formErrors[key] ? <span className="text-xs font-bold text-red-600">{formErrors[key]}</span> : null}
                  </label>
                ))}
                <button className="btn-primary w-full px-4 py-3 disabled:opacity-50" disabled={!user || busy} onClick={ripple} type="submit">Pay with Razorpay</button>
                {!user ? <p className="text-xs text-[var(--text-muted)]">Sign in to place an order.</p> : null}
              </form>
            </section>

            <section className="glass-panel rounded p-4">
              <h2 className="text-xl font-black">Profile dashboard</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{user ? `${user.name} · ${user.email}` : "Sign in to unlock profile insights."}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded bg-[var(--surface-secondary)] p-3"><p className="text-2xl font-black text-[var(--text-primary)]">{orders.length}</p><p className="text-xs font-bold text-[var(--text-muted)]">Orders</p></div>
                <div className="rounded bg-[var(--surface-secondary)] p-3"><p className="text-2xl font-black text-[var(--text-primary)]">{cartCount}</p><p className="text-xs font-bold text-[var(--text-muted)]">Cart items</p></div>
              </div>
              <Link className="mt-3 block rounded border border-[var(--brand-green)] px-4 py-2 text-center text-sm font-black text-[var(--brand-green)] hover:bg-[var(--brand-green)] hover:text-white" href="/profile">Open profile</Link>
            </section>
          </aside>
        </div>
      </section>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
