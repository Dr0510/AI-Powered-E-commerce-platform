"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  Star,
  TrendingDown,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  }),
};

function MiniSparkline({ data = [], color = "#176e63", height = 40 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || data.length < 2) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const h = height;
    const padding = 4;

    ctx.clearRect(0, 0, width, h);

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const stepX = (width - padding * 2) / (data.length - 1);

    // Draw gradient fill
    ctx.beginPath();
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, `${color}40`);
    gradient.addColorStop(1, `${color}05`);
    ctx.fillStyle = gradient;

    data.forEach((val, i) => {
      const x = padding + i * stepX;
      const y = h - padding - ((val - min) / range) * (h - padding * 2);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(width - padding, h);
    ctx.lineTo(padding, h);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    data.forEach((val, i) => {
      const x = padding + i * stepX;
      const y = h - padding - ((val - min) / range) * (h - padding * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw dot at end
    const lastX = padding + (data.length - 1) * stepX;
    const lastY = h - padding - ((data[data.length - 1] - min) / range) * (h - padding * 2);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [data, color, height]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={height}
      className="w-full h-full"
      style={{ maxWidth: 120, height }}
    />
  );
}

const kpiConfig = [
  {
    key: "revenue",
    label: "Total Revenue",
    icon: DollarSign,
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/10 to-teal-500/10",
    trend: "+12.5%",
    trendUp: true,
    format: "currency",
    sparklineColor: "#10b981",
    sparklineData: [3200, 4100, 3800, 5200, 4800, 6100, 7400],
  },
  {
    key: "orders",
    label: "Total Orders",
    icon: ShoppingCart,
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10",
    trend: "+8.2%",
    trendUp: true,
    format: "number",
    sparklineColor: "#3b82f6",
    sparklineData: [12, 19, 15, 22, 18, 25, 31],
  },
  {
    key: "products",
    label: "Products",
    icon: Package,
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-500/10 to-purple-500/10",
    trend: "+3 new",
    trendUp: true,
    format: "number",
    sparklineColor: "#8b5cf6",
    sparklineData: [8, 10, 12, 14, 16, 18, 22],
  },
  {
    key: "followers",
    label: "Followers",
    icon: Users,
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-500/10 to-orange-500/10",
    trend: "+8 this week",
    trendUp: true,
    format: "number",
    sparklineColor: "#f59e0b",
    sparklineData: [45, 52, 48, 56, 62, 58, 68],
  },
  {
    key: "conversion",
    label: "Conversion Rate",
    icon: TrendingUp,
    gradient: "from-rose-500 to-pink-500",
    bgGradient: "from-rose-500/10 to-pink-500/10",
    trend: "+2.1%",
    trendUp: false,
    format: "percent",
    sparklineColor: "#f43f5e",
    sparklineData: [3.2, 3.5, 3.1, 3.8, 3.6, 4.2, 4.1],
  },
  {
    key: "rating",
    label: "Average Rating",
    icon: Star,
    gradient: "from-indigo-500 to-blue-500",
    bgGradient: "from-indigo-500/10 to-blue-500/10",
    trend: "+0.2",
    trendUp: true,
    format: "rating",
    sparklineColor: "#6366f1",
    sparklineData: [4.2, 4.3, 4.1, 4.4, 4.5, 4.3, 4.6],
  },
];

export default function DashboardKPI({ stats, seller }) {
  const getValue = (key) => {
    switch (key) {
      case "revenue":
        const rev = Number(seller?.total_earnings || stats?.revenue || 0);
        return `₹${(rev / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      case "orders":
        return Math.round(stats?.orders || 0).toLocaleString("en-IN");
      case "products":
        return Math.round(stats?.products || 0).toLocaleString("en-IN");
      case "followers":
        return Math.round(stats?.followers || 0).toLocaleString("en-IN");
      case "conversion":
        return `${(Number(stats?.conversion_rate) || 0).toFixed(1)}%`;
      case "rating":
        return `${Number(seller?.performance_score || stats?.rating || 0).toFixed(1)}/5`;
      default:
        return "0";
    }
  };

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
    >
      {kpiConfig.map((kpi, index) => {
        const Icon = kpi.icon;
        const TrendIcon = kpi.trendUp ? TrendingUp : TrendingDown;

        return (
          <motion.div
            key={kpi.key}
            className="relative overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group"
            variants={fadeUp}
            custom={index}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.bgGradient} opacity-60`} />

            <div className="relative">
              {/* Header */}
              <div className="flex items-start justify-between">
                <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">
                  {kpi.label}
                </p>
                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-[18px] h-[18px] text-white" />
                </div>
              </div>

              {/* Value */}
              <p className="mt-3 text-xl font-black text-[var(--text-primary)]">
                {getValue(kpi.key)}
              </p>

              {/* Trend row */}
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${kpi.trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                  <TrendIcon className="w-3 h-3" />
                  {kpi.trend}
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">vs last month</span>
              </div>

              {/* Sparkline */}
              <div className="mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                <MiniSparkline data={kpi.sparklineData} color={kpi.sparklineColor} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}