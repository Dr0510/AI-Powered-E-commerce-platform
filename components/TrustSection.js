"use client";

import { motion } from "framer-motion";

const trustItems = [
  { icon: "🛡️", stat: "10,000+", label: "Happy Customers", desc: "Trusted by shoppers across India" },
  { icon: "🏪", stat: "500+", label: "Verified Sellers", desc: "Curated & quality-checked" },
  { icon: "🔒", stat: "100%", label: "Secure Payments", desc: "Powered by Razorpay" },
  { icon: "🚚", stat: "Free", label: "Delivery", desc: "On orders above ₹500" },
];

const features = [
  { icon: "✓", text: "Verified & vetted sellers only" },
  { icon: "✓", text: "Razorpay protected checkout" },
  { icon: "✓", text: "Easy order tracking" },
  { icon: "✓", text: "Hassle-free returns" },
  { icon: "✓", text: "AI-powered product discovery" },
  { icon: "✓", text: "Dedicated customer support" },
];

export default function TrustSection() {
  return (
    <section className="rounded-xl bg-[var(--surface-primary)] border border-[var(--border-primary)] p-6 md:p-8">
      {/* Stats grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {trustItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-center"
          >
            <span className="text-3xl">{item.icon}</span>
            <p className="mt-2 text-2xl font-black text-[var(--text-primary)]">{item.stat}</p>
            <p className="text-xs font-bold text-[var(--text-accent)]">{item.label}</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Divider */}
      <div className="my-6 h-px bg-gradient-to-r from-transparent via-[var(--border-primary)] to-transparent" />

      {/* Feature list */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.text}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex items-center gap-2.5 rounded-lg bg-[var(--badge-green-bg)] px-4 py-3"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-green)] text-[10px] font-black text-white">
              {feature.icon}
            </span>
            <span className="text-xs font-bold text-[var(--text-secondary)]">{feature.text}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}