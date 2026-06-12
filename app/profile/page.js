"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { money, formatDate } from "@/lib/format";
import { StoreHeader } from "@/components/StoreShell";
import { ProfileSkeleton } from "@/components/SkeletonLoaders";
import {
  User,
  Mail,
  ShoppingBag,
  Heart,
  Package,
  Clock,
  ChevronRight,
  ArrowRight,
  MapPin,
  Phone,
  CreditCard,
  LogOut,
  Settings,
  Store,
  Star,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  }),
};

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

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : "?";

  return (
    <main className="luxury-shell min-h-screen text-[var(--text-primary)]">
      <StoreHeader user={user} />

      <section className="mx-auto max-w-7xl px-4 py-6">
        {/* ─── Hero Banner ─────────────────────────────── */}
        <motion.div
          className="relative overflow-hidden rounded-3xl border border-[var(--border-primary)] bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-green-bright)] p-6 md:p-8 shadow-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-black/5 rounded-full blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-3xl md:text-4xl font-black text-white shadow-xl">
                {user?.image ? (
                  <img src={user.image} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  initials
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-black uppercase tracking-wider mb-2">
                <Star className="w-3 h-3" />
                Profile dashboard
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white">
                {user?.name || "Welcome to DR MART"}
              </h1>
              <p className="mt-1 text-white/80 text-sm max-w-xl">
                {status}
              </p>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-white/80 text-xs font-bold">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {orders.length} orders
                </div>
                <div className="flex items-center gap-1.5 text-white/80 text-xs font-bold">
                  <Heart className="w-3.5 h-3.5" />
                  {wishlist.length} wishlist
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[var(--brand-green)] font-black text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex-shrink-0"
            >
              <Package className="w-4 h-4" />
              Track orders
            </Link>
          </div>
        </motion.div>

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <motion.div
            className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
          >
            {/* ─── Account Sidebar ───────────────────────── */}
            <motion.aside
              className="space-y-4"
              variants={fadeUp}
            >
              {/* Account Card */}
              <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 shadow-sm">
                <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--text-accent)]" />
                  Account
                </h2>

                <div className="mt-4 space-y-3">
                  {[
                    { icon: User, label: "Name", value: user?.name || "Guest" },
                    { icon: Mail, label: "Email", value: user?.email || "Not signed in" },
                    { icon: MapPin, label: "Location", value: user?.city || user?.state || "—" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--text-muted)]">{item.label}</p>
                          <p className="text-sm font-bold text-[var(--text-primary)] truncate">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-2">
                  {[
                    { icon: ShoppingBag, label: "Orders", href: "/orders", count: orders.length },
                    { icon: Heart, label: "Wishlist", href: "/wishlist", count: wishlist.length },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--tab-hover-bg)] transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                          <span className="text-sm font-bold text-[var(--text-primary)]">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[var(--text-accent)] bg-[var(--tab-active-bg)] px-2 py-0.5 rounded-full">
                            {item.count}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <Link
                  href="/orders"
                  className="mt-4 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white text-sm font-black shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  <Package className="w-4 h-4" />
                  Track orders
                </Link>
              </div>

              {/* Quick Links */}
              <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 shadow-sm">
                <h2 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                  Quick Links
                </h2>
                <div className="space-y-1">
                  {[
                    { icon: Store, label: "Browse stores", href: "/sellers" },
                    { icon: Star, label: "Top sellers", href: "/leaderboard" },
                    { icon: CreditCard, label: "Payment methods", href: "/orders" },
                    { icon: Settings, label: "Account settings", href: "/profile" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--tab-hover-bg)] transition-all"
                      >
                        <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.aside>

            {/* ─── Main Content ──────────────────────────── */}
            <div className="space-y-6">
              {/* Recent Orders */}
              <motion.section
                className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-sm overflow-hidden"
                variants={fadeUp}
              >
                <div className="p-5 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-black text-[var(--text-primary)]">Recent Orders</h2>
                        <p className="text-xs text-[var(--text-muted)] font-medium">{orders.length} total orders</p>
                      </div>
                    </div>
                    <Link
                      href="/orders"
                      className="inline-flex items-center gap-1 text-xs font-black text-[var(--text-accent)] hover:text-[var(--brand-green-bright)] transition-all"
                    >
                      View all <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="divide-y divide-[var(--border-subtle)]">
                  {orders.slice(0, 4).map((order, index) => (
                    <motion.div
                      key={order._id || order.id || index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <Link
                        href="/orders"
                        className="flex items-center justify-between p-4 hover:bg-[var(--tab-hover-bg)] transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-green)]/20 to-[var(--brand-green-bright)]/20 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-[var(--text-accent)]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">
                              Order #{order._id?.slice(-8) || order.id?.toString().slice(-6) || "000000"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]">
                                {order.fulfillmentStatus || order.status || "Pending"}
                              </span>
                              <span className="text-xs text-[var(--text-muted)]">
                                {order.createdAt || order.created_at ? formatDate(order.createdAt || order.created_at) : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-[var(--text-primary)]">
                            {money(order.total || order.total_in_paise ? (order.total || order.total_in_paise) / 100 : 0)}
                          </p>
                          <ChevronRight className="w-4 h-4 text-[var(--text-muted)] ml-auto group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                  {!orders.length && (
                    <div className="p-8 text-center">
                      <Package className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-30 mb-3" />
                      <p className="text-sm font-bold text-[var(--text-primary)]">No orders yet</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Start shopping to see your orders here.</p>
                      <Link href="/" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white text-xs font-black">
                        <Store className="w-3.5 h-3.5" />
                        Browse products
                      </Link>
                    </div>
                  )}
                </div>
              </motion.section>

              {/* Recently Viewed */}
              <motion.section
                className="rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-sm overflow-hidden"
                variants={fadeUp}
              >
                <div className="p-5 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-[var(--text-primary)]">Recently Viewed</h2>
                      <p className="text-xs text-[var(--text-muted)] font-medium">{recent.length} products</p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {recent.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {recent.map((item, index) => (
                        <Link
                          key={item.productId || index}
                          href={`/product/${item.productId}`}
                          className="group rounded-xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-3 hover:shadow-md transition-all hover:-translate-y-1"
                        >
                          <div className="h-24 w-full rounded-lg bg-[var(--card-bg)] flex items-center justify-center p-2 overflow-hidden">
                            {item.image ? (
                              <img alt={item.title} className="h-full w-full object-contain group-hover:scale-105 transition-transform" src={item.image} />
                            ) : (
                              <Package className="w-8 h-8 text-[var(--text-muted)]" />
                            )}
                          </div>
                          <p className="mt-2 text-xs font-bold text-[var(--text-primary)] line-clamp-2 leading-relaxed">
                            {item.title || "Product"}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Clock className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-30 mb-3" />
                      <p className="text-sm font-bold text-[var(--text-primary)]">No recently viewed items</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Products you view will appear here.</p>
                    </div>
                  )}
                </div>
              </motion.section>
            </div>
          </motion.div>
        )}
      </section>
    </main>
  );
}