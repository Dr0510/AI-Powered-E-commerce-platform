"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthControls from "@/components/AuthControls";
import { api } from "@/lib/api";
import { discountFor, money, ratingFor } from "@/lib/format";

const shippingDefaults = {
  name: "",
  line1: "",
  city: "",
  country: "",
  phone: "",
  pincode: "",
};

const quickCategories = [
  "Mobiles",
  "Fashion",
  "Electronics",
  "Home",
  "Footwear",
  "Appliances",
  "Beauty",
  "Toys",
  "Accessories",
];

const categoryShowcase = [
  { name: "Mobiles", offer: "5G phones from DR Group partners", color: "bg-sky-50 text-sky-900" },
  { name: "Fashion", offer: "Fresh styles, daily drops", color: "bg-pink-50 text-pink-900" },
  { name: "Electronics", offer: "TV, audio, gadgets", color: "bg-indigo-50 text-indigo-900" },
  { name: "Appliances", offer: "Home upgrades on EMI", color: "bg-amber-50 text-amber-900" },
  { name: "Beauty", offer: "Care kits and grooming", color: "bg-rose-50 text-rose-900" },
  { name: "Toys", offer: "Learning and fun picks", color: "bg-lime-50 text-lime-900" },
];

function loadRazorpayCheckout() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout"));
    document.body.appendChild(script);
  });
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [shipping, setShipping] = useState(shippingDefaults);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [aiSearch, setAiSearch] = useState(true);
  const [searchMode, setSearchMode] = useState("catalog");
  const [status, setStatus] = useState("Loading products...");
  const [busy, setBusy] = useState(false);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const cartCount = useMemo(
    () => (mounted ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0),
    [cart, mounted],
  );

  const categories = useMemo(() => {
    const fromProducts = products.map((product) => product.category).filter(Boolean);
    return Array.from(new Set([...quickCategories, ...fromProducts])).sort();
  }, [products]);

  async function loadProducts(nextQuery = query, nextCategory = category, nextAi = aiSearch) {
    const params = new URLSearchParams();
    if (nextQuery) {
      params.set("q", nextQuery);
    }
    if (nextCategory) {
      params.set("category", nextCategory);
    }
    if (nextAi) {
      params.set("ai", "true");
    }

    const suffix = params.toString() ? `?${params}` : "";
    const data = await api(`/api/products${suffix}`);
    setProducts(data.products);
    setSearchMode(data.mode);
    setStatus(`Showing ${data.products.length} products with ${data.mode} search`);
  }

  async function loadUser() {
    const data = await api("/api/auth/me");
    setUser(data.user);
    return data.user;
  }

  async function loadOrdersFor(nextUser) {
    if (!nextUser) {
      setOrders([]);
      return;
    }

    const data = await api("/api/orders");
    setOrders(data.orders);
  }

  useEffect(() => {
    async function boot() {
      const [, nextUser] = await Promise.all([loadProducts("", "", true), loadUser()]);
      await loadOrdersFor(nextUser);
    }

    boot().catch((error) => {
      setStatus(error.message);
    });
    // Run once on mount to hydrate the storefront.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("commerce_cart");
    if (saved) {
      setCart(JSON.parse(saved));
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    async function refreshSession() {
      try {
        const nextUser = await loadUser();
        await loadOrdersFor(nextUser);
      } catch {
        setUser(null);
        setOrders([]);
      }
    }

    window.addEventListener("focus", refreshSession);
    document.addEventListener("visibilitychange", refreshSession);
    return () => {
      window.removeEventListener("focus", refreshSession);
      document.removeEventListener("visibilitychange", refreshSession);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("commerce_cart", JSON.stringify(cart));
  }, [cart]);

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product._id);
      if (existing) {
        return current.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [
        ...current,
        {
          productId: product._id,
          title: product.title,
          price: product.price,
          image: product.image,
          quantity: 1,
        },
      ];
    });
  }

  function updateCart(productId, quantity) {
    setCart((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    );
  }

  async function seedProducts() {
    setBusy(true);
    setStatus("Seeding catalog with Gemini embeddings...");

    try {
      const data = await api("/api/seed");
      await loadProducts("", "", true);
      setQuery("");
      setCategory("");
      setStatus(`${data.message}. Added ${data.count} products.`);
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
      await loadProducts(query, category, aiSearch);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function chooseCategory(nextCategory) {
    setCategory(nextCategory);
    setBusy(true);

    try {
      await loadProducts("", nextCategory, aiSearch);
      setQuery("");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function checkout(event) {
    event.preventDefault();
    if (!cart.length) {
      setStatus("Add products to your cart first");
      return;
    }

    setBusy(true);
    setStatus("Creating order...");

    try {
      const data = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({ items: cart, shippingAddress: shipping }),
      });

      setStatus("Opening Razorpay checkout...");
      const payment = await api("/api/payments/razorpay", {
        method: "POST",
        body: JSON.stringify({ orderId: data.order._id }),
      });

      await loadRazorpayCheckout();

      const success = await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: payment.keyId,
          amount: payment.amountInPaise,
          currency: payment.currency,
          name: "DR Mart",
          description: `Order #${payment.localOrderId.slice(-6)}`,
          order_id: payment.razorpayOrderId,
          prefill: {
            name: payment.name || shipping.name,
            email: payment.email,
          },
          notes: {
            localOrderId: payment.localOrderId,
          },
          theme: {
            color: "#2874f0",
          },
          handler: async (response) => {
            try {
              await api("/api/payments/razorpay", {
                method: "PUT",
                body: JSON.stringify({
                  localOrderId: payment.localOrderId,
                  ...response,
                }),
              });
              resolve(true);
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => resolve(false),
          },
        });

        checkout.open();
      });

      if (success) {
        setCart([]);
        setShipping(shippingDefaults);
        await loadOrdersFor(user);
        setStatus(`Payment complete. Order ${data.order._id.slice(-6)} created.`);
      } else {
        await loadOrdersFor(user);
        setStatus(`Order ${data.order._id.slice(-6)} is waiting for payment.`);
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#e6e6e6] text-slate-950">
      <header className="sticky top-0 z-30 bg-[#131921] text-white shadow-md">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-3 py-3 lg:flex-row lg:items-center">
          <div className="flex items-center justify-between gap-4">
            <button className="text-left" onClick={() => chooseCategory("")} type="button">
              <img alt="DR Group" className="h-12" src="/dr-group-logo.svg" />
            </button>
            <Link
              className="relative rounded border border-slate-500 px-3 py-2 text-sm font-semibold lg:hidden"
              href="/cart"
            >
              Cart {cartCount}
            </Link>
            <button
              className="relative rounded border border-slate-500 px-3 py-2 text-sm font-semibold lg:hidden"
              type="button"
            >
              Menu
            </button>
          </div>

          <form className="flex min-w-0 flex-1 overflow-hidden rounded" onSubmit={search}>
            <select
              className="w-28 border-0 bg-slate-100 px-2 text-sm text-slate-900 outline-none"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="">All</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              className="min-w-0 flex-1 border-0 bg-white px-4 py-3 text-sm text-slate-950 outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search DR Mart with Gemini AI"
              value={query}
            />
            <button
              className="bg-[#febd69] px-5 text-lg font-black text-slate-950 disabled:opacity-60"
              disabled={busy}
              type="submit"
            >
              Search
            </button>
          </form>

          <div className="hidden items-center gap-5 text-sm lg:flex">
            <Link href="/assistant">
              <p className="text-xs text-slate-300">Gemini</p>
              <p className="font-bold">AI Assistant</p>
            </Link>
            <Link href="/wishlist">
              <p className="text-xs text-slate-300">Saved</p>
              <p className="font-bold">Wishlist</p>
            </Link>
            <div>
              <p className="text-xs text-slate-300">Hello, {user?.name || "sign in"}</p>
              <p className="font-bold">Account</p>
            </div>
            <AuthControls compact />
            <Link href="/orders">
              <p className="text-xs text-slate-300">Returns</p>
              <p className="font-bold">& Orders</p>
            </Link>
            <Link className="relative" href="/cart">
              <span className="absolute -top-3 left-4 rounded-full bg-[#f08804] px-2 text-xs font-black text-slate-950">
                {cartCount}
              </span>
              <p className="pt-2 font-bold">Cart</p>
            </Link>
          </div>
        </div>

        <nav className="bg-[#232f3e]">
          <div className="mx-auto flex max-w-[1500px] gap-2 overflow-x-auto px-3 py-2 text-sm">
            <button className="shrink-0 font-bold" onClick={seedProducts} type="button">
              Seed DR Deals
            </button>
            <Link className="shrink-0 rounded px-2 py-1 font-bold hover:bg-white/10" href="/admin">
              Admin
            </Link>
            <label className="flex shrink-0 items-center gap-2 px-2">
              <input
                checked={aiSearch}
                onChange={(event) => setAiSearch(event.target.checked)}
                type="checkbox"
              />
              Gemini AI Search
            </label>
            {quickCategories.map((item) => (
              <button
                className="shrink-0 rounded px-2 py-1 hover:bg-white/10"
                key={item}
                onClick={() => chooseCategory(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-[1500px] px-3 py-4">
        <div className="grid gap-4 lg:grid-cols-[230px_1fr_340px]">
          <aside className="hidden space-y-4 lg:block">
            <section className="rounded bg-white p-4 shadow-sm">
              <h2 className="text-base font-bold">Shop by category</h2>
              <div className="mt-3 space-y-1">
                <button
                  className={`block w-full rounded px-2 py-2 text-left text-sm ${!category ? "bg-orange-100 font-bold" : "hover:bg-slate-100"}`}
                  onClick={() => chooseCategory("")}
                  type="button"
                >
                  All products
                </button>
                {categories.slice(0, 12).map((item) => (
                  <button
                    className={`block w-full rounded px-2 py-2 text-left text-sm ${category === item ? "bg-orange-100 font-bold" : "hover:bg-slate-100"}`}
                    key={item}
                    onClick={() => chooseCategory(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded bg-white p-4 shadow-sm">
              <h2 className="text-base font-bold">Account</h2>
              {user ? (
                <div className="mt-3 space-y-3 text-sm">
                  <p>
                    Signed in as <strong>{user.name}</strong>
                  </p>
                  <p className="rounded bg-slate-50 p-2 text-xs text-slate-600">{user.email}</p>
                  <AuthControls />
                </div>
              ) : (
                <div className="mt-3 space-y-3 text-sm">
                  <p className="text-slate-600">Sign in with Clerk to place prepaid Razorpay orders and track purchases.</p>
                  <AuthControls />
                </div>
              )}
            </section>
          </aside>

          <div className="space-y-4">
            <section className="relative overflow-hidden rounded bg-[#2874f0] p-5 text-white shadow-sm md:p-7">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase">DR Group Mega Store</p>
                <h1 className="mt-1 text-3xl font-black tracking-normal md:text-5xl">
                  DR Mart, by DR Group
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-blue-50">
                  A Croma-style multi-category store experience with Gemini search, fast checkout, and seller tools for every department.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    className="rounded bg-[#ff9f00] px-4 py-2 text-sm font-black text-slate-950"
                    onClick={seedProducts}
                    type="button"
                  >
                    Load DR deals
                  </button>
                  <span className="rounded bg-white/15 px-4 py-2 text-sm font-bold">
                    {searchMode} mode
                  </span>
                  <span className="rounded bg-white/15 px-4 py-2 text-sm font-bold">
                    DR Assured delivery
                  </span>
                </div>
              </div>
              <div className="absolute right-5 top-5 hidden rounded bg-white px-4 py-3 text-slate-950 shadow-lg md:block">
                <p className="text-xs font-bold uppercase text-blue-700">Today only</p>
                <p className="text-2xl font-black">Up to 72% off</p>
                <p className="text-xs text-slate-500">Mobiles, TV, fashion and more</p>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categoryShowcase.map((item) => (
                <button
                  className={`rounded p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.color}`}
                  key={item.name}
                  onClick={() => chooseCategory(item.name)}
                  type="button"
                >
                  <span className="text-lg font-black">{item.name}</span>
                  <span className="mt-1 block text-sm opacity-80">{item.offer}</span>
                </button>
              ))}
            </section>

            <section className="grid gap-3 md:grid-cols-3">
              <div className="rounded bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500">DR Plus</p>
                <p className="mt-1 text-lg font-black">Free delivery on select orders</p>
              </div>
              <div className="rounded bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500">Bank offer</p>
                <p className="mt-1 text-lg font-black">10% instant discount</p>
              </div>
              <div className="rounded bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500">Gemini AI</p>
                <p className="mt-1 text-lg font-black">Search by need, not keywords</p>
              </div>
            </section>

            <section className="rounded bg-white p-4 shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-3 md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl font-black">DR Mart top picks</h2>
                  <p className="text-sm text-slate-500">{status}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="rounded bg-green-700 px-2 py-1 text-white">DR Assured</span>
                  <span className="rounded bg-slate-100 px-2 py-1">{products.length} results</span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => {
                  const discount = discountFor(product);
                  const mrp = product.price / (1 - discount / 100);

                  return (
                    <article
                      className="group rounded border border-slate-200 bg-white p-3 transition hover:border-orange-300 hover:shadow-lg"
                      key={product._id}
                    >
                      <Link href={`/product/${product._id}`}>
                        <div className="relative aspect-square overflow-hidden rounded bg-slate-50">
                          <span className="absolute left-2 top-2 z-10 rounded bg-[#cc0c39] px-2 py-1 text-xs font-bold text-white">
                            Deal
                          </span>
                          {product.image ? (
                            <img
                              alt={product.title}
                              className="h-full w-full object-contain p-4 transition group-hover:scale-105"
                              src={product.image}
                            />
                          ) : null}
                        </div>
                      </Link>
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-bold uppercase text-blue-700">{product.category}</p>
                        <Link className="block hover:text-blue-700" href={`/product/${product._id}`}>
                          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5">
                          {product.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-green-700 px-1.5 py-0.5 text-xs font-bold text-white">
                            {ratingFor(product)} star
                          </span>
                          <span className="text-xs text-slate-500">Free delivery</span>
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black">{money(product.price)}</span>
                            <span className="text-xs text-slate-400 line-through">{money(mrp)}</span>
                          </div>
                          <p className="text-xs font-bold text-green-700">{discount}% off</p>
                        </div>
                        <p className="line-clamp-2 text-xs leading-5 text-slate-600">{product.description}</p>
                        <div className="flex gap-2 pt-1">
                          <button
                            className="flex-1 rounded-full bg-[#ffd814] px-3 py-2 text-xs font-black hover:bg-[#f7ca00]"
                            onClick={() => addToCart(product)}
                            type="button"
                          >
                            Add to Cart
                          </button>
                          <button
                            className="rounded-full bg-[#ffa41c] px-3 py-2 text-xs font-black hover:bg-[#fa8900]"
                            onClick={() => addToCart(product)}
                            type="button"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black">Cart</h2>
              <p className="text-sm text-slate-500">{cartCount} items</p>
              <div className="mt-4 max-h-72 space-y-3 overflow-auto">
                {cart.length ? (
                  cart.map((item) => (
                    <div className="flex gap-3 border-b border-slate-100 pb-3" key={item.productId}>
                      <img alt="" className="h-16 w-16 rounded object-contain" src={item.image} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{item.title}</p>
                        <p className="text-sm font-black">{money(item.price)}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            className="h-7 w-7 rounded border border-slate-300"
                            onClick={() => updateCart(item.productId, item.quantity - 1)}
                            type="button"
                          >
                            -
                          </button>
                          <span className="min-w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            className="h-7 w-7 rounded border border-slate-300"
                            onClick={() => updateCart(item.productId, item.quantity + 1)}
                            type="button"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded bg-slate-50 p-3 text-sm text-slate-500">Your cart is empty.</p>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="font-bold">Subtotal</span>
                <span className="text-xl font-black">{money(cartTotal)}</span>
              </div>
            </section>

            <section className="rounded bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black">Checkout</h2>
              <form className="mt-3 space-y-2" onSubmit={checkout}>
                {Object.keys(shippingDefaults).map((key) => (
                  <input
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    key={key}
                    onChange={(event) => setShipping({ ...shipping, [key]: event.target.value })}
                    placeholder={key === "line1" ? "Address" : key[0].toUpperCase() + key.slice(1)}
                    value={shipping[key]}
                  />
                ))}
                <button
                  className="w-full rounded bg-[#ffa41c] px-4 py-2 text-sm font-black disabled:opacity-50"
                  disabled={!user || busy}
                  type="submit"
                >
                  Pay with Razorpay
                </button>
                {!user ? <p className="text-xs text-slate-500">Login to place an order.</p> : null}
              </form>
            </section>

            <section className="rounded bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black">Admin tools</h2>
              <p className="mt-2 text-sm text-slate-600">
                Manage products, Cloudinary images, inventory, and orders from the protected admin dashboard.
              </p>
              <Link
                className="mt-3 block rounded bg-[#2874f0] px-4 py-2 text-center text-sm font-black text-white"
                href="/admin"
              >
                Open admin
              </Link>
            </section>

            <section className="rounded bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black">Orders</h2>
              <div className="mt-3 space-y-2">
                {orders.length ? (
                  orders.map((order) => (
                    <div className="rounded border border-slate-200 p-3" key={order._id}>
                      <div className="flex items-center justify-between text-sm font-bold">
                        <span>Order #{order._id.slice(-6)}</span>
                        <span>{money(order.total)}</span>
                      </div>
                      <p className="mt-1 text-xs font-bold uppercase text-green-700">{order.status}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No orders yet.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
