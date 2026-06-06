"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { StoreHeader, StatusPill } from "@/components/StoreShell";
import { ProfileSkeleton } from "@/components/SkeletonLoaders";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [recent, setRecent] = useState([]);
  const [status, setStatus] = useState("Loading profile...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const userData = await api("/api/auth/me");
      if (!active) return;
      setUser(userData.user);
      setWishlist(JSON.parse(localStorage.getItem("dr_wishlist") || "[]"));
      setRecent(JSON.parse(localStorage.getItem("dr_recently_viewed") || "[]").slice(0, 6));
      if (userData.user) {
        const orderData = await api("/api/orders");
        if (active) setOrders(orderData.orders);
      }
      if (active) setStatus(userData.user ? "Your DR MART dashboard is ready." : "Sign in to view your dashboard.");
      if (active) setIsLoading(false);
    }
    load().catch((error) => active && setStatus(error.message));
    const interval = setInterval(() => {
      load().catch((error) => active && console.error(error));
    }, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="luxury-shell min-h-screen text-[var(--text-primary)]">
      <StoreHeader user={user} />
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="brand-gradient rounded p-6 text-white md:p-8">
          <StatusPill tone="gold">Profile dashboard</StatusPill>
          <h1 className="mt-4 text-4xl font-black">{user?.name || "Welcome to DR MART"}</h1>
          <p className="mt-2 max-w-2xl text-[#f6efe4]">{status}</p>
        </div>

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr]">
          <aside className="glass-panel rounded p-5">
            <h2 className="text-xl font-black">Account</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p><strong>Name:</strong> {user?.name || "Guest"}</p>
              <p><strong>Email:</strong> {user?.email || "Not signed in"}</p>
              <p><strong>Orders:</strong> {orders.length}</p>
              <p><strong>Wishlist:</strong> {wishlist.length}</p>
            </div>
            <Link className="mt-5 block rounded bg-[#123f3a] px-4 py-2 text-center font-black text-white" href="/orders">Track orders</Link>
          </aside>

          <div className="space-y-5">
            <section className="glass-panel rounded p-5">
              <h2 className="text-2xl font-black">Recent orders</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {orders.slice(0, 4).map((order) => (
                  <Link className="rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4" href="/orders" key={order._id}>
                    <p className="font-black">Order #{order._id.slice(-8)}</p>
                    <p className="mt-1 text-sm font-bold uppercase text-[var(--text-accent)]">{order.fulfillmentStatus || order.status}</p>
                    <p className="mt-2 text-xl font-black">{money(order.total)}</p>
                  </Link>
                ))}
                {!orders.length ? <p className="rounded bg-[var(--surface-primary)] border border-[var(--border-primary)] p-4 text-[var(--text-muted)]">No orders yet.</p> : null}
              </div>
            </section>

            <section className="glass-panel rounded p-5">
              <h2 className="text-2xl font-black">Recently viewed</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((item) => (
                  <Link className="rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] p-3 hover:-translate-y-1 flex flex-col justify-between" href={`/product/${item.productId}`} key={item.productId}>
                    <div className="h-28 w-full overflow-hidden rounded bg-[var(--surface-secondary)] p-2 flex items-center justify-center">
                      <img alt={item.title} className="h-full w-full object-contain" src={item.image} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-black">{item.title}</p>
                  </Link>
                ))}
                {!recent.length ? <p className="rounded bg-[var(--surface-primary)] border border-[var(--border-primary)] p-4 text-[var(--text-muted)]">Product views will appear here.</p> : null}
              </div>
            </section>
          </div>
        </div>
        )}
      </section>
    </main>
  );
}
