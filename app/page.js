"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { priceInPaise } from "@/lib/format";
import { StoreHeader, StatusPill } from "@/components/StoreShell";
import { useToast, ToastContainer } from "@/components/Toast";
import HeroBanner from "@/components/HeroBanner";
import CategoryShowcase from "@/components/CategoryShowcase";
import FeaturedProducts from "@/components/FeaturedProducts";
import ProductGrid from "@/components/ProductGrid";
import TrustSection from "@/components/TrustSection";
import SiteFooter from "@/components/SiteFooter";
import CartDrawer from "@/components/CartDrawer";

const categoriesSeed = ["Mobiles", "Fashion", "Electronics", "Home", "Footwear", "Appliances", "Beauty", "Toys", "Accessories"];

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
  // ── Data state ──
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [savedProductIds, setSavedProductIds] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("Loading curated products...");
  const [saveNotice, setSaveNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // ── Filter state ──
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("featured");
  const [priceBand, setPriceBand] = useState("all");
  const [stockOnly, setStockOnly] = useState(false);

  // ── UX feedback state ──
  const [savingProductId, setSavingProductId] = useState("");
  const [removingProductId, setRemovingProductId] = useState("");
  const [cartAddedId, setCartAddedId] = useState("");

  const { toasts, showToast, dismissToast } = useToast();

  // ── Computed ──
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + priceInPaise(item) * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const categories = useMemo(() => {
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...categoriesSeed, ...fromProducts])).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const filtered = products
      .filter((p) => (stockOnly ? p.stock > 0 : true))
      .filter((p) => {
        if (priceBand === "all") return true;
        if (priceBand === "under5") return p.price < 5000;
        if (priceBand === "5to15") return p.price >= 5000 && p.price <= 15000;
        return p.price > 15000;
      });
    return [...filtered].sort((a, b) => {
      if (sort === "priceAsc") return a.price - b.price;
      if (sort === "priceDesc") return b.price - a.price;
      if (sort === "rating") return (b._id?.charCodeAt(0) || 4) - (a._id?.charCodeAt(0) || 4);
      if (sort === "stock") return b.stock - a.stock;
      return (a.title?.length || 0) * 6 + 12 - ((b.title?.length || 0) * 6 + 12); // discount sort
    });
  }, [products, priceBand, sort, stockOnly]);

  const trending = useMemo(() => {
    return [...filteredProducts]
      .filter((p) => p.stock > 0)
      .sort((a, b) => (b._id?.charCodeAt(0) || 0) - (a._id?.charCodeAt(0) || 0))
      .slice(0, 10);
  }, [filteredProducts]);

  // ── Data loading ──
  async function loadProducts(nextQuery = query, nextCategory = category) {
    try {
      const params = new URLSearchParams();
      if (nextQuery) params.set("q", nextQuery);
      if (nextCategory) params.set("category", nextCategory);
      params.set("ai", "true");
      const data = await api(`/api/products?${params}`);
      const list = Array.isArray(data.products) ? data.products : [];
      setProducts(list);
      setStatus(`${list.length} products matched.`);
    } catch (error) {
      setStatus(error.message);
    }
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [productData, userData] = await Promise.all([
          api("/api/products?ai=true").catch(() => ({ products: [] })),
          api("/api/auth/me").catch(() => ({ user: null })),
        ]);
        if (!active) return;
        const list = Array.isArray(productData.products) ? productData.products : [];
        setProducts(list);
        setUser(userData?.user || null);
        setStatus(`${list.length} products ready.`);
        setIsLoading(false);
        if (userData?.user) {
          const orderData = await api("/api/orders").catch(() => ({ orders: [] }));
          if (active) setOrders(Array.isArray(orderData.orders) ? orderData.orders : []);
        }
      } catch (error) {
        if (active) setStatus(error.message);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  // ── Cart persistence ──
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

  // ── Actions ──
  function addToCart(product, immediate = false) {
    if (product.stock <= 0) {
      showToast(`${product.title} is out of stock`, "warn");
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.productId === product._id);
      if (existing && existing.quantity >= product.stock) {
        showToast(`Only ${product.stock} units available`, "warn");
        return current;
      }
      return existing
        ? current.map((item) =>
            item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [cartItem(product), ...current];
    });
    showToast("✓ Added to cart", "success");
    if (!immediate) {
      setCartAddedId(product._id);
      window.setTimeout(() => setCartAddedId(""), 900);
    }
    if (immediate) {
      setCartDrawerOpen(true);
    }
  }

  function toggleWishlist(product) {
    const current = JSON.parse(localStorage.getItem("dr_wishlist") || "[]");
    const alreadySaved = savedProductIds.includes(product._id);
    setSaveNotice("");

    if (alreadySaved) {
      setRemovingProductId(product._id);
      const updated = current.filter((entry) => entry.productId !== product._id);
      localStorage.setItem("dr_wishlist", JSON.stringify(updated));
      window.setTimeout(() => {
        setSavedProductIds((ids) => ids.filter((id) => id !== product._id));
        setRemovingProductId("");
        setSaveNotice(`${product.title} removed from wishlist.`);
        showToast("Removed from wishlist", "info");
      }, 420);
    } else {
      setSavingProductId(product._id);
      const item = { ...cartItem(product), category: product.category };
      localStorage.setItem("dr_wishlist", JSON.stringify([item, ...current.filter((e) => e.productId !== product._id)]));
      window.setTimeout(() => {
        setSavedProductIds((ids) => Array.from(new Set([product._id, ...ids])));
        setSavingProductId("");
        setSaveNotice(`${product.title} saved to wishlist.`);
        showToast("♥ Saved to wishlist", "success");
      }, 420);
    }
  }

  function updateCart(productId, quantity) {
    setCart((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    );
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

  function handleCategorySelect(cat) {
    setCategory(cat);
    setQuery("");
    loadProducts("", cat);
  }

  function handleQueryChange(val) {
    setQuery(val);
  }

  return (
    <main className="luxury-shell min-h-screen text-[var(--text-primary)]">
      <StoreHeader
        cartCount={cartCount}
        user={user}
        onCartClick={() => setCartDrawerOpen(true)}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Hero Banner */}
        <HeroBanner
          categories={categories}
          onCategorySelect={handleCategorySelect}
          onSearch={search}
          query={query}
          onQueryChange={handleQueryChange}
          visibleProducts={filteredProducts}
        />

        {/* Category Showcase */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <CategoryShowcase
            categories={categories}
            onSelect={handleCategorySelect}
            activeCategory={category}
          />
        </motion.div>

        {/* Trending / Featured */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <FeaturedProducts products={trending} />
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {["Verified sellers", "Razorpay protected", "Easy order tracking"].map((text) => (
              <div key={text} className="glass-panel rounded-xl p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#7c6a55]">
                  DR MART Standard
                </p>
                <p className="mt-1 text-base font-black text-[var(--text-primary)]">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Product Grid */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <ProductGrid
            products={filteredProducts}
            isLoading={isLoading}
            status={status}
            saveNotice={saveNotice}
            savedProductIds={savedProductIds}
            cartAddedId={cartAddedId}
            savingProductId={savingProductId}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            onSeedCatalog={seedProducts}
            onPriceBandChange={setPriceBand}
            onSortChange={setSort}
            onStockToggle={setStockOnly}
            priceBand={priceBand}
            sort={sort}
            stockOnly={stockOnly}
            busy={busy}
          />
        </motion.div>

        {/* Trust Section */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <TrustSection />
        </motion.div>
      </div>

      {/* Footer */}
      <SiteFooter />

      {/* Cart Drawer */}
      <CartDrawer
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cart={cart}
        cartTotal={cartTotal}
        cartCount={cartCount}
        user={user}
        onUpdateCart={updateCart}
      />

      {/* Toast */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}