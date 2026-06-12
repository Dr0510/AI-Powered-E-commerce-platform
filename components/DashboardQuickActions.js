"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Package,
  ShoppingCart,
  Wallet,
  Megaphone,
  TicketPercent,
  MessageSquare,
  Settings,
  ArrowRight,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] },
  }),
};

const actions = [
  {
    href: "/seller/products",
    icon: Plus,
    title: "Add Product",
    sub: "List a new product in your store",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/10 to-teal-500/10",
  },
  {
    href: "/seller/products",
    icon: Package,
    title: "Manage Products",
    sub: "Edit, update, or remove items",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    href: "/seller/orders",
    icon: ShoppingCart,
    title: "View Orders",
    sub: "Track and update fulfillment",
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-500/10 to-purple-500/10",
  },
  {
    href: "/seller/payouts",
    icon: Wallet,
    title: "Withdraw Earnings",
    sub: "Transfer funds to your account",
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-500/10 to-orange-500/10",
  },
  {
    href: "/seller/coupons",
    icon: TicketPercent,
    title: "Coupons",
    sub: "Create promotional offers",
    gradient: "from-rose-500 to-pink-500",
    bgGradient: "from-rose-500/10 to-pink-500/10",
  },
  {
    href: "/seller/messages",
    icon: MessageSquare,
    title: "Messages",
    sub: "Chat with your customers",
    gradient: "from-indigo-500 to-blue-500",
    bgGradient: "from-indigo-500/10 to-blue-500/10",
  },
  {
    href: "/seller/bulk-upload",
    icon: Megaphone,
    title: "Promotions",
    sub: "Run sales and promotions",
    gradient: "from-cyan-500 to-teal-500",
    bgGradient: "from-cyan-500/10 to-teal-500/10",
  },
  {
    href: "/seller/settings",
    icon: Settings,
    title: "Store Settings",
    sub: "Manage store and profile settings",
    gradient: "from-slate-500 to-slate-700",
    bgGradient: "from-slate-500/10 to-slate-700/10",
  },
];

export default function DashboardQuickActions() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">Quick Actions</h2>
          <p className="text-sm text-[var(--text-muted)] font-medium mt-0.5">
            Jump to the tools you use most.
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center rounded-full bg-[var(--tab-active-bg)] px-3 py-1 text-xs font-black text-[var(--text-accent)] border border-[var(--brand-green)]/10">
          {actions.length} shortcuts
        </span>
      </div>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } }}
      >
        {actions.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div key={`action-${index}`} variants={fadeUp} custom={index}>
              <Link
                href={item.href}
                className="group block h-full rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="mt-4 text-sm font-black text-[var(--text-primary)]">{item.title}</p>
                  <p className="mt-1 text-xs font-medium text-[var(--text-muted)] line-clamp-2">{item.sub}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-black text-[var(--text-accent)] group-hover:gap-2 transition-all">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
}