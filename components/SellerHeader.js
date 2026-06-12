"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Store,
  Moon,
  Sun,
} from "lucide-react";
import { useToast } from "@/components/Toast";

export default function SellerHeader({ seller, scrolled }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/seller/products?search=${encodeURIComponent(searchQuery.trim())}`);
        setSearchOpen(false);
        setSearchQuery("");
      }
    },
    [searchQuery, router]
  );

  const initials = seller?.shop_name
    ? seller.shop_name.charAt(0).toUpperCase()
    : "S";

  return (
    <header
      className={`sticky top-0 z-20 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--surface-elevated)]/90 backdrop-blur-xl border-b border-[var(--border-primary)] shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left: Breadcrumb / Title */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-[var(--text-muted)] font-medium">Dashboard</span>
            <span className="text-[var(--text-muted)]">/</span>
            <span className="text-[var(--text-primary)] font-bold">Overview</span>
          </div>
        </div>

        {/* Right: Search, Notifications, Messages, Profile */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Search */}
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--tab-hover-bg)] transition-all"
              type="button"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                  className="absolute right-0 top-full mt-2 w-80 md:w-96"
                >
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products, orders..."
                      className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-[var(--surface-primary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)]/20 focus:border-[var(--brand-green)]/40 transition-all shadow-lg"
                      autoFocus
                    />
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md bg-[var(--surface-secondary)] text-[10px] font-bold text-[var(--text-muted)] border border-[var(--border-subtle)]">
                      ⌘K
                    </kbd>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--tab-hover-bg)] transition-all"
              type="button"
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--brand-green-bright)] shadow-sm" />
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] backdrop-blur-xl shadow-xl overflow-hidden"
                >
                  <div className="p-4 border-b border-[var(--border-subtle)]">
                    <p className="text-sm font-black text-[var(--text-primary)]">Notifications</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[var(--text-muted)] text-center">No new notifications</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages */}
          <button
            onClick={() => router.push("/seller/messages")}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--tab-hover-bg)] transition-all"
            type="button"
            aria-label="Messages"
          >
            <MessageSquare className="w-[18px] h-[18px]" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[var(--tab-hover-bg)] transition-all group"
              type="button"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-green-bright)] flex items-center justify-center text-white text-xs font-black shadow-sm">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-black text-[var(--text-primary)] leading-tight truncate max-w-[100px]">
                  {seller?.shop_name || "Store"}
                </p>
                <p className="text-[10px] font-medium text-[var(--text-muted)] leading-tight">
                  {seller?.subscription_plan || "Standard"} Plan
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:rotate-180 transition-transform" />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] backdrop-blur-xl shadow-xl overflow-hidden"
                >
                  <div className="p-3 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-green-bright)] flex items-center justify-center text-white text-sm font-black">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-[var(--text-primary)] truncate">
                          {seller?.shop_name || "Store"}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] truncate">
                          {seller?.shop_slug ? `${seller.shop_slug}` : "No store yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5">
                    {[
                      { icon: User, label: "My Profile", href: "/profile" },
                      { icon: Store, label: "View Store", href: seller?.shop_slug ? `/store/${seller.shop_slug}` : "#" },
                      { icon: Settings, label: "Settings", href: "/seller/settings" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={() => {
                            setProfileOpen(false);
                            if (item.href !== "#") router.push(item.href);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--tab-hover-bg)] transition-all"
                          type="button"
                        >
                          <Icon className="w-[16px] h-[16px]" />
                          {item.label}
                        </button>
                      );
                    })}
                    <div className="border-t border-[var(--border-subtle)] mt-1 pt-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          showToast("Logged out", "success");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        type="button"
                      >
                        <LogOut className="w-[16px] h-[16px]" />
                        Logout
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}