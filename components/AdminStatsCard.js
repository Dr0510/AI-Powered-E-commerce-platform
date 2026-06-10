"use client";

export default function AdminStatsCard({ label, value, icon, trend, trendLabel, gradient, prefix = "", suffix = "" }) {
  const trendUp = trend && trend >= 0;
  const gradientMap = {
    green: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/20",
    purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20",
    rose: "from-rose-500/20 to-rose-600/5 border-rose-500/20",
    teal: "from-teal-500/20 to-teal-600/5 border-teal-500/20",
  };
  const gradientClass = gradientMap[gradient] || gradientMap.green;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] backdrop-blur-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--brand-green)]/5 hover:-translate-y-0.5">
      {/* Gradient accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientClass.split(" ")[0]} ${gradientClass.split(" ")[1]}`} />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {label}
          </p>
          <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {prefix}{typeof value === "number" ? value.toLocaleString("en-IN") : value}{suffix}
          </p>
          {trend !== undefined && (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              trendUp
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}>
              <span>{trendUp ? "↑" : "↓"}</span>
              <span>{Math.abs(trend)}%</span>
              {trendLabel && <span className="opacity-70">vs {trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
    </div>
  );
}