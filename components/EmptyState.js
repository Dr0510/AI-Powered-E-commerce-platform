"use client";

import Link from "next/link";

export default function EmptyState({
  icon = "📭",
  title = "Nothing here yet",
  description = "",
  actionLabel = "",
  actionHref = "/",
  tone = "default", // "default" | "gold" | "rose"
}) {
  const toneStyles = {
    default: {},
    gold: { background: "var(--badge-gold-bg)", borderColor: "var(--badge-gold-text)" },
    rose: { background: "var(--badge-rose-bg)", borderColor: "var(--badge-rose-text)" },
  };

  return (
    <div className="empty-state stagger-in" style={toneStyles[tone] || {}}>
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && (
        <Link
          className="mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-black transition-all"
          href={actionHref}
          style={{
            background: "var(--brand-green)",
            color: "#fff",
          }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
