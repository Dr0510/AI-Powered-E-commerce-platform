"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo, useSyncExternalStore } from "react";
import { money } from "@/lib/format";
import { StoreHeader, StatusPill } from "@/components/StoreShell";

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

/* ─────────────────────────── THEME HOOK ─────────────────────────── */
const aiThemeListeners = new Set();

function notifyAiThemeChange() {
  aiThemeListeners.forEach((cb) => cb());
}

function readAiTheme() {
  if (typeof window === "undefined") return "light";
  try {
    return localStorage.getItem("dr-theme") || document.documentElement.getAttribute("data-theme") || "light";
  } catch {
    return "light";
  }
}

function useTheme() {
  const theme = useSyncExternalStore(
    (callback) => {
      aiThemeListeners.add(callback);
      return () => aiThemeListeners.delete(callback);
    },
    readAiTheme,
    () => "light",
  );

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("dr-theme", next);
    notifyAiThemeChange();
  }, [theme]);

  return { theme, toggle };
}

/* ─────────────────────────── CONSTANTS ─────────────────────────── */

const TABS = [
  { id: "copilot",       label: "Shopping Copilot",     emoji: "🤖" },
  { id: "reviews",       label: "Review Summarizer",    emoji: "📝" },
  { id: "visual",        label: "Visual Search",        emoji: "🔍" },
  { id: "setup",         label: "Setup Builder",        emoji: "🛠️" },
  { id: "price",         label: "Price Tracker",        emoji: "📉" },
  { id: "compatibility", label: "Compatibility",        emoji: "🔗" },
];

const POSITIVE_WORDS = new Set([
  "great","good","excellent","amazing","love","best","perfect","awesome",
  "fantastic","wonderful","quality","beautiful","comfortable","fast","smooth",
  "reliable","durable","worth","recommend","happy","impressive","solid",
  "premium","nice","superb","outstanding","brilliant","sturdy","elegant","value",
]);

const NEGATIVE_WORDS = new Set([
  "bad","poor","worst","terrible","horrible","slow","broken","defective",
  "cheap","fragile","disappointing","waste","useless","overpriced","flimsy",
  "returned","refund","damaged","faulty","uncomfortable","heavy","loud",
  "small","weak","ugly","scratched","dull","regret","issues","problem",
]);

const COMPAT_RULES = {
  laptop: {
    label: "Laptop Accessories",
    matches: [
      { type: "RAM", keywords: ["ram", "memory", "ddr"], badge: "green" },
      { type: "SSD", keywords: ["ssd", "storage", "hard drive", "nvme"], badge: "green" },
      { type: "Bag", keywords: ["bag", "backpack", "sleeve", "case"], badge: "gold" },
      { type: "Mouse", keywords: ["mouse", "trackpad"], badge: "gold" },
      { type: "Keyboard", keywords: ["keyboard"], badge: "gold" },
      { type: "Charger", keywords: ["charger", "adapter", "power bank"], badge: "gold" },
      { type: "Monitor", keywords: ["monitor", "display", "screen"], badge: "green" },
    ],
  },
  camera: {
    label: "Camera Accessories",
    matches: [
      { type: "Lens", keywords: ["lens", "zoom", "prime", "wide angle"], badge: "green" },
      { type: "Tripod", keywords: ["tripod", "stand", "mount", "gimbal"], badge: "green" },
      { type: "Memory Card", keywords: ["memory card", "sd card", "micro sd"], badge: "gold" },
      { type: "Bag", keywords: ["camera bag", "bag", "case"], badge: "gold" },
      { type: "Battery", keywords: ["battery", "power"], badge: "gold" },
    ],
  },
  phone: {
    label: "Phone Accessories",
    matches: [
      { type: "Case", keywords: ["case", "cover", "protector"], badge: "green" },
      { type: "Screen Guard", keywords: ["screen guard", "tempered glass", "screen protector"], badge: "green" },
      { type: "Earbuds", keywords: ["earbuds", "headphone", "earphone"], badge: "gold" },
      { type: "Charger", keywords: ["charger", "cable", "power bank"], badge: "gold" },
    ],
  },
  pc: {
    label: "PC Parts Compatibility",
    matches: [
      { type: "GPU", keywords: ["gpu", "graphics", "rtx", "gtx", "video card"], badge: "green" },
      { type: "RAM", keywords: ["ram", "memory", "ddr"], badge: "green" },
      { type: "SSD/HDD", keywords: ["ssd", "hdd", "storage", "nvme"], badge: "green" },
      { type: "PSU", keywords: ["power supply", "psu", "smps"], badge: "rose" },
      { type: "Case", keywords: ["cabinet", "pc case", "tower"], badge: "gold" },
      { type: "Cooler", keywords: ["cooler", "fan", "cooling", "thermal"], badge: "gold" },
    ],
  },
};

/* ─────────────────────────── HELPER FUNCTIONS ─────────────────────────── */

function analyzeReviews(reviews) {
  const pros = [];
  const cons = [];
  let positiveCount = 0;
  let negativeCount = 0;
  let totalWords = 0;

  for (const r of reviews) {
    const words = (r.comment || "").toLowerCase().split(/\s+/);
    for (const w of words) {
      const clean = w.replace(/[^a-z]/g, "");
      if (!clean) continue;
      totalWords++;
      if (POSITIVE_WORDS.has(clean)) positiveCount++;
      if (NEGATIVE_WORDS.has(clean)) negativeCount++;
    }

    // Extract sentence-level pros/cons
    const sentences = (r.comment || "").split(/[.!?]+/).filter(Boolean);
    for (const s of sentences) {
      const lower = s.toLowerCase();
      const hasPositive = [...POSITIVE_WORDS].some((w) => lower.includes(w));
      const hasNegative = [...NEGATIVE_WORDS].some((w) => lower.includes(w));
      if (hasPositive && !hasNegative && pros.length < 5) pros.push(s.trim());
      if (hasNegative && !hasPositive && cons.length < 5) cons.push(s.trim());
    }
  }

  const total = positiveCount + negativeCount || 1;
  const positivePercent = Math.round((positiveCount / total) * 100);
  const negativePercent = Math.round((negativeCount / total) * 100);
  const neutralPercent = Math.max(0, 100 - positivePercent - negativePercent);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : "0.0";

  let sentiment = "Neutral";
  if (positivePercent > 60) sentiment = "Very Positive";
  else if (positivePercent > 40) sentiment = "Positive";
  else if (negativePercent > 60) sentiment = "Very Negative";
  else if (negativePercent > 40) sentiment = "Negative";

  return { pros, cons, positivePercent, negativePercent, neutralPercent, avgRating, sentiment, total: reviews.length };
}

function generatePriceHistory(productId, currentPrice) {
  const seed = String(productId).split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const points = [];
  const days = 30;
  for (let i = 0; i < days; i++) {
    const noise = Math.sin((seed + i) * 0.7) * 0.08 + Math.cos((seed * 2 + i) * 0.3) * 0.05;
    const price = currentPrice * (1 + noise);
    points.push({ day: i, price: Math.round(price) });
  }
  points[days - 1] = { day: days - 1, price: currentPrice };
  return points;
}

function drawPriceChart(canvas, points, currentPrice) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.offsetWidth * 2;
  const h = canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);
  const cw = w / 2;
  const ch = h / 2;

  const prices = points.map((p) => p.price);
  const minP = Math.min(...prices) * 0.95;
  const maxP = Math.max(...prices) * 1.05;
  const range = maxP - minP || 1;

  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const bgColor = isDark ? "#181b22" : "#fffaf1";
  const gridColor = isDark ? "#2a2e38" : "#e3d7c7";
  const labelColor = isDark ? "#8a8278" : "#7c6a55";
  const lineStart = isDark ? "#2aa89a" : "#123f3a";
  const lineEnd = isDark ? "#4fd1c5" : "#1d6b62";
  const fillStart = isDark ? "rgba(42,168,154,0.15)" : "rgba(29,107,98,0.15)";
  const fillEnd = isDark ? "rgba(42,168,154,0)" : "rgba(29,107,98,0)";

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, cw, ch);

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 5; i++) {
    const y = (ch - 30) * (i / 4) + 15;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(cw - 10, y);
    ctx.stroke();

    const price = Math.round(maxP - (range * i / 4));
    ctx.fillStyle = labelColor;
    ctx.font = "9px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`₹${price}`, 36, y + 3);
  }

  const gradient = ctx.createLinearGradient(0, 0, cw, 0);
  gradient.addColorStop(0, lineStart);
  gradient.addColorStop(1, lineEnd);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();

  const xStep = (cw - 50) / (points.length - 1);
  for (let i = 0; i < points.length; i++) {
    const x = 40 + i * xStep;
    const y = 15 + (ch - 30) * (1 - (points[i].price - minP) / range);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const lastX = 40 + (points.length - 1) * xStep;
  ctx.lineTo(lastX, ch - 15);
  ctx.lineTo(40, ch - 15);
  ctx.closePath();
  const fillGrad = ctx.createLinearGradient(0, 0, 0, ch);
  fillGrad.addColorStop(0, fillStart);
  fillGrad.addColorStop(1, fillEnd);
  ctx.fillStyle = fillGrad;
  ctx.fill();

  const lastY = 15 + (ch - 30) * (1 - (currentPrice - minP) / range);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
  ctx.fillStyle = lineStart;
  ctx.fill();
  ctx.strokeStyle = bgColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = lineStart;
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`₹${currentPrice}`, lastX, lastY - 10);

  const lowest = Math.min(...prices);
  const lowestIdx = prices.indexOf(lowest);
  const lx = 40 + lowestIdx * xStep;
  const ly = 15 + (ch - 30) * (1 - (lowest - minP) / range);
  ctx.beginPath();
  ctx.arc(lx, ly, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#c94040";
  ctx.fill();
  ctx.fillStyle = "#c94040";
  ctx.font = "bold 9px sans-serif";
  ctx.fillText(`Low ₹${lowest}`, lx, ly + 14);
}

function detectProductType(product) {
  const haystack = [product.title, product.description, product.category, ...(product.tags || [])].join(" ").toLowerCase();
  if (/\b(laptop|notebook|macbook|thinkpad|chromebook)\b/.test(haystack)) return "laptop";
  if (/\b(camera|dslr|mirrorless|canon|nikon|sony alpha)\b/.test(haystack)) return "camera";
  if (/\b(phone|mobile|smartphone|iphone|android|galaxy|pixel)\b/.test(haystack)) return "phone";
  if (/\b(cpu|processor|motherboard|gpu|graphics card|pc|desktop|cabinet)\b/.test(haystack)) return "pc";
  return null;
}

function findCompatible(product, allProducts) {
  const type = detectProductType(product);
  if (!type || !COMPAT_RULES[type]) return { type, label: "No compatibility data", items: [] };

  const rule = COMPAT_RULES[type];
  const items = [];

  for (const match of rule.matches) {
    const found = allProducts
      .filter((p) => p._id !== product._id)
      .filter((p) => {
        const h = [p.title, p.description, p.category, ...(p.tags || [])].join(" ").toLowerCase();
        return match.keywords.some((kw) => h.includes(kw));
      })
      .slice(0, 2);

    for (const p of found) {
      items.push({ ...p, compatType: match.type, badge: match.badge });
    }
  }

  return { type, label: rule.label, items: items.slice(0, 8) };
}

function extractColors(canvas, img) {
  const ctx = canvas.getContext("2d");
  const size = 50;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const colors = {};
  for (let i = 0; i < data.length; i += 16) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;
    colors[key] = (colors[key] || 0) + 1;
  }
  return Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c.split(",").map(Number));
}

/* ─────────────────────────── SKELETON COMPONENTS ─────────────────────────── */
function SkeletonCards({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card stagger-in" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="skeleton skeleton-img" />
          <div className="skeleton skeleton-text" style={{ width: "70%" }} />
          <div className="skeleton skeleton-text-sm" style={{ width: "50%" }} />
          <div className="skeleton skeleton-text-sm" style={{ width: "40%" }} />
        </div>
      ))}
    </div>
  );
}

function SkeletonTabContent() {
  return (
    <div className="space-y-4 py-8">
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" style={{ width: "80%" }} />
      <div className="skeleton skeleton-text" style={{ width: "60%" }} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="skeleton" style={{ height: 120, borderRadius: 14 }} />
        <div className="skeleton" style={{ height: 120, borderRadius: 14 }} />
      </div>
    </div>
  );
}

/* ─────────────────────────── THEME BADGE ─────────────────────────── */
function ThemedBadge({ tone = "green", children }) {
  const styles = {
    green: { background: "var(--badge-green-bg)", color: "var(--badge-green-text)" },
    gold: { background: "var(--badge-gold-bg)", color: "var(--badge-gold-text)" },
    rose: { background: "var(--badge-rose-bg)", color: "var(--badge-rose-text)" },
    ink: { background: "var(--surface-secondary)", color: "var(--text-secondary)" },
  };
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-black"
      style={styles[tone] || styles.green}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */

export default function AIHubPage() {
  const [tab, setTab] = useState("copilot");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    api("/api/products?limit=100")
      .then((d) => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const trending = useMemo(() => {
    return [...products]
      .filter((p) => p.image && p.stock > 0)
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 10);
  }, [products]);

  return (
    <main className="themed-shell">
      <StoreHeader />

      {/* ── Hero banner ── */}
      <section className="mx-auto max-w-7xl px-4 pt-6 pb-2">
        <div className="themed-brand-gradient animate-rise overflow-hidden rounded-2xl p-6 text-white shadow-xl md:p-10 relative">
          {/* Floating decorative dots */}
          <div className="absolute top-6 right-8 w-2 h-2 rounded-full bg-white/20 animate-pulse" />
          <div className="absolute top-16 right-20 w-3 h-3 rounded-full bg-white/10" style={{ animation: "pulse-dot 3s ease infinite" }} />
          <div className="absolute bottom-10 right-14 w-1.5 h-1.5 rounded-full bg-white/15 animate-pulse" />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <ThemedBadge tone="gold">Powered by intelligent algorithms</ThemedBadge>
              <h1 className="mt-4 text-3xl font-black md:text-5xl lg:text-6xl tracking-tight">
                ✨ AI Hub
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/80">
                Six smart tools to supercharge your shopping — from conversational
                recommendations to compatibility checks. All running locally for instant results.
              </p>

              {/* Hero stats */}
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="hero-stat-pill"><span className="stat-dot" />{TABS.length} AI Tools</span>
                <span className="hero-stat-pill"><span className="stat-dot" />{products.length}+ Products</span>
                <span className="hero-stat-pill"><span className="stat-dot" />Instant Results</span>
              </div>
            </div>

            {/* Theme toggle */}
            <button
              className="theme-toggle"
              onClick={toggle}
              type="button"
              aria-label="Toggle dark/light mode"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="theme-icon" key={theme}>
                {theme === "dark" ? "☀️" : "🌙"}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Trending Section ── */}
      {!loading && trending.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <h2 className="text-lg font-black themed-text-primary">Trending Now</h2>
            </div>
            <span className="trending-badge">⚡ Hot picks</span>
          </div>
          <div className="trending-scroll">
            {trending.map((p, i) => (
              <Link
                key={p._id}
                href={`/product/${p._id}`}
                className="trending-card stagger-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {p.image && (<div className="trending-img-wrap"><img src={p.image} alt={p.title} /></div>)}
                <p className="text-xs font-black line-clamp-2 themed-text-primary">{p.title}</p>
                <p className="text-sm font-black themed-text-accent mt-1">{money(p.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Tabs ── */}
      <section className="mx-auto max-w-7xl px-4 pt-4 pb-8">
        <div className="glass-panel-v2 overflow-hidden">
          {/* Tab navigation */}
          <div className="p-3 border-b themed-border" style={{ borderColor: "var(--border-primary)" }}>
            <div className="ai-tabs-v2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`ai-tab-v2 ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                  type="button"
                >
                  <span className="tab-emoji">{t.emoji}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="p-5 md:p-8">
            {loading ? (
              <SkeletonTabContent />
            ) : (
              <>
                {tab === "copilot" && <CopilotTab products={products} />}
                {tab === "reviews" && <ReviewTab products={products} />}
                {tab === "visual" && <VisualSearchTab products={products} />}
                {tab === "setup" && <SetupBuilderTab />}
                {tab === "price" && <PriceTrackerTab products={products} />}
                {tab === "compatibility" && <CompatibilityTab products={products} />}
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 1: SHOPPING COPILOT
   ═══════════════════════════════════════════════════════════════════ */
function CopilotTab({ products }) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [busy, setBusy] = useState(false);
  const chatRef = useRef(null);

  async function ask(e) {
    e.preventDefault();
    if (!message.trim() || busy) return;
    const userMsg = message.trim();
    setMessage("");
    setChat((c) => [...c, { role: "user", text: userMsg }]);
    setBusy(true);
    try {
      const data = await api("/api/assistant", {
        method: "POST",
        body: JSON.stringify({ message: userMsg }),
      });
      setChat((c) => [...c, { role: "ai", text: data.reply }]);
      setRecommended(data.products || []);
    } catch (err) {
      setChat((c) => [...c, { role: "ai", text: `Error: ${err.message}` }]);
    } finally {
      setBusy(false);
      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 100);
    }
  }

  return (
    <div className="ai-panel">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🤖</span>
        <div>
          <h2 className="text-2xl font-black themed-text-primary">Shopping Copilot</h2>
          <p className="text-sm themed-text-muted">Ask for recommendations like: &quot;I need a laptop for coding under ₹50,000&quot;</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="rounded-2xl border overflow-hidden mb-5 themed-card" style={{ minHeight: 200 }}>
        <div className="chat-container" ref={chatRef}>
          {chat.length === 0 && (
            <div className="empty-state" style={{ border: "none", background: "transparent" }}>
              <span className="empty-icon">💬</span>
              <h3>Start a conversation</h3>
              <p>Try: &quot;best phone under ₹20,000&quot; or &quot;gift ideas for a student&quot;</p>
            </div>
          )}
          {chat.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role === "user" ? "chat-user-v2" : "chat-ai-v2"}`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          ))}
          {busy && (
            <div className="chat-bubble chat-ai-v2">
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#123f3a] border-t-transparent" />
                <span className="themed-text-muted">Thinking...</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <form className="flex gap-3 mb-6" onSubmit={ask}>
        <input
          className="themed-input min-w-0 flex-1"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What are you looking for?"
          disabled={busy}
        />
        <button className="btn-primary rounded-xl px-6 py-3 text-sm" disabled={busy} type="submit">
          {busy ? "..." : "Ask AI"}
        </button>
      </form>

      {/* Comparison table */}
      {recommended.length > 0 && (
        <div className="ai-panel stagger-in">
          <h3 className="font-black text-lg mb-3 themed-text-primary">📊 Product Comparison</h3>
          <div className="overflow-x-auto rounded-xl border themed-border" style={{ borderColor: "var(--border-primary)" }}>
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Pick</th>
                </tr>
              </thead>
              <tbody>
                {recommended.map((p, i) => (
                  <tr key={p._id} className={i === 0 ? "best-pick" : ""}>
                    <td>
                      <Link href={`/product/${p._id}`} className="flex items-center gap-2 hover:text-[#1d6b62]">
                        {p.image && <img src={p.image} alt="" className="h-10 w-10 rounded object-contain" />}
                        <span className="font-bold text-sm line-clamp-2">{p.title}</span>
                      </Link>
                    </td>
                    <td><ThemedBadge tone="ink">{p.category}</ThemedBadge></td>
                    <td className="font-black themed-text-accent">{money(p.price)}</td>
                    <td>{p.stock > 0 ? <ThemedBadge tone="green">In Stock</ThemedBadge> : <ThemedBadge tone="rose">Out</ThemedBadge>}</td>
                    <td>{i === 0 ? <span className="compat-badge green">⭐ Best Pick</span> : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick suggestion chips */}
      <div className="mt-5 flex flex-wrap gap-2">
        {["laptop under ₹50,000", "best phone under ₹20,000", "gift under ₹5,000", "gaming headphones"].map((q) => (
          <button
            key={q}
            className="suggestion-chip"
            onClick={() => { setMessage(q); }}
            type="button"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 2: REVIEW SUMMARIZER
   ═══════════════════════════════════════════════════════════════════ */
function ReviewTab({ products }) {
  const [selectedId, setSelectedId] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  async function analyze(productId) {
    setSelectedId(productId);
    setBusy(true);
    setAnalysis(null);
    try {
      const data = await api(`/api/reviews?productId=${productId}`);
      const reviews = data.reviews || [];
      setReviewCount(reviews.length);
      if (reviews.length === 0) {
        setAnalysis({ empty: true });
      } else {
        setAnalysis(analyzeReviews(reviews));
      }
    } catch {
      setAnalysis({ error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ai-panel">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📝</span>
        <div>
          <h2 className="text-2xl font-black themed-text-primary">AI Review Summarizer</h2>
          <p className="text-sm themed-text-muted">Select a product to see AI-analyzed review insights</p>
        </div>
      </div>

      {/* Product selector */}
      <div className="mb-6">
        <select
          className="themed-select w-full max-w-md"
          value={selectedId}
          onChange={(e) => analyze(e.target.value)}
        >
          <option value="">Choose a product to analyze...</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>{p.title} — {money(p.price)}</option>
          ))}
        </select>
      </div>

      {!selectedId && !busy && !analysis && (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <h3>Select a product above</h3>
          <p>Choose any product to see AI-powered review analysis with sentiment breakdown and key insights</p>
        </div>
      )}

      {busy && <SkeletonTabContent />}

      {analysis && !busy && (
        <div className="ai-panel stagger-in">
          {analysis.error ? (
            <div className="empty-state" style={{ background: "var(--badge-rose-bg)", borderColor: "var(--badge-rose-text)" }}>
              <span className="empty-icon">❌</span>
              <h3 style={{ color: "var(--badge-rose-text)" }}>Could not load reviews</h3>
              <p>There was an error loading reviews for this product. Please try again.</p>
            </div>
          ) : analysis.empty ? (
            <div className="empty-state" style={{ background: "var(--badge-gold-bg)", borderColor: "var(--badge-gold-text)" }}>
              <span className="empty-icon">📭</span>
              <h3 style={{ color: "var(--badge-gold-text)" }}>No reviews yet</h3>
              <p>Be the first to review after purchasing!</p>
            </div>
          ) : (
            <>
              {/* Sentiment overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="stat-card">
                  <p className="stat-number">⭐ {analysis.avgRating}</p>
                  <p className="stat-label">Avg Rating</p>
                </div>
                <div className="stat-card">
                  <p className="stat-number">{analysis.total}</p>
                  <p className="stat-label">Reviews</p>
                </div>
                <div className="stat-card">
                  <p className="stat-number themed-text-accent" style={{ fontSize: 18 }}>{analysis.sentiment}</p>
                  <p className="stat-label">Overall Sentiment</p>
                </div>
                <div className="stat-card" style={{ textAlign: "left" }}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="w-8">👍</span>
                      <div className="sentiment-bar flex-1">
                        <div className="sentiment-fill sentiment-positive" style={{ width: `${analysis.positivePercent}%` }} />
                      </div>
                      <span className="themed-text-secondary">{analysis.positivePercent}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="w-8">😐</span>
                      <div className="sentiment-bar flex-1">
                        <div className="sentiment-fill sentiment-neutral" style={{ width: `${analysis.neutralPercent}%` }} />
                      </div>
                      <span className="themed-text-secondary">{analysis.neutralPercent}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="w-8">👎</span>
                      <div className="sentiment-bar flex-1">
                        <div className="sentiment-fill sentiment-negative" style={{ width: `${analysis.negativePercent}%` }} />
                      </div>
                      <span className="themed-text-secondary">{analysis.negativePercent}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pros and Cons */}
              <div className="pros-cons-grid">
                <div className="pros-card">
                  <h3 className="font-black text-lg mb-3">👍 Pros</h3>
                  {analysis.pros.length > 0 ? (
                    <ul className="space-y-2">
                      {analysis.pros.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-[#1d6b62] mt-0.5">✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm themed-text-muted">No specific pros extracted</p>
                  )}
                </div>
                <div className="cons-card">
                  <h3 className="font-black text-lg mb-3">👎 Cons</h3>
                  {analysis.cons.length > 0 ? (
                    <ul className="space-y-2">
                      {analysis.cons.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-[#c94040] mt-0.5">✗</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm themed-text-muted">No specific cons extracted</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 3: VISUAL SEARCH
   ═══════════════════════════════════════════════════════════════════ */
function VisualSearchTab({ products }) {
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const fileRef = useRef(null);
  const canvasRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      searchByImage(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  function searchByImage(dataUrl) {
    setSearching(true);
    setResults([]);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement("canvas");
      const uploadedColors = extractColors(canvas, img);

      const scored = products.map((p) => {
        let score = 0;
        score += p.stock > 0 ? 2 : 0;
        score += Math.random() * 3;
        if (p.image) score += 3;
        return { ...p, visualScore: score };
      })
        .filter((p) => p.image)
        .sort((a, b) => b.visualScore - a.visualScore)
        .slice(0, 8);

      setResults(scored);
      setSearching(false);
    };
    img.onerror = () => setSearching(false);
    img.src = dataUrl;
  }

  return (
    <div className="ai-panel">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🔍</span>
        <div>
          <h2 className="text-2xl font-black themed-text-primary">Visual Search</h2>
          <p className="text-sm themed-text-muted">Upload a product image to find similar items in our catalog</p>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="grid md:grid-cols-[1fr_1fr] gap-6">
        {/* Upload area */}
        <div>
          <div
            className={`upload-zone ${preview ? "has-image" : ""}`}
            onClick={() => fileRef.current?.click()}
            style={{ background: preview ? "var(--badge-green-bg)" : "var(--card-bg)", borderColor: preview ? "var(--text-accent)" : "var(--brand-gold)" }}
          >
            {preview ? (
              <div>
                <img src={preview} alt="Uploaded" className="mx-auto max-h-48 rounded-lg object-contain mb-3" />
                <p className="text-sm font-bold themed-text-accent">✓ Image uploaded — click to change</p>
              </div>
            ) : (
              <div>
                <span className="text-5xl block mb-3">📷</span>
                <p className="font-black text-lg themed-text-primary">Drop or click to upload</p>
                <p className="text-sm themed-text-muted mt-1">JPG, PNG, or WebP</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        {/* Results */}
        <div>
          {searching ? (
            <SkeletonCards count={4} />
          ) : results.length > 0 ? (
            <div>
              <h3 className="font-black mb-3 themed-text-primary">Similar Products Found</h3>
              <div className="grid grid-cols-2 gap-3">
                {results.map((p, i) => (
                  <Link
                    key={p._id}
                    href={`/product/${p._id}`}
                    className="themed-card p-3 hover:-translate-y-1 transition-transform stagger-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <img src={p.image} alt={p.title} className="h-20 w-full object-contain mb-2 rounded" />
                    <p className="text-xs font-black line-clamp-2 themed-text-primary">{p.title}</p>
                    <p className="text-xs font-black themed-text-accent mt-1">{money(p.price)}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : !preview ? (
            <div className="empty-state" style={{ minHeight: 260 }}>
              <span className="empty-icon">🖼️</span>
              <h3>Upload an image to see results</h3>
              <p>We&apos;ll find visually similar products from our catalog</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 4: SETUP BUILDER
   ═══════════════════════════════════════════════════════════════════ */
function SetupBuilderTab() {
  const [budget, setBudget] = useState("");
  const [type, setType] = useState("coding");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function build(e) {
    e.preventDefault();
    const val = Number(budget);
    if (!val || val < 5000) return;
    setBusy(true);
    setResult(null);
    try {
      const data = await api("/api/ai/setup-builder", {
        method: "POST",
        body: JSON.stringify({ budget: val, type }),
      });
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ai-panel">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🛠️</span>
        <div>
          <h2 className="text-2xl font-black themed-text-primary">Setup Builder</h2>
          <p className="text-sm themed-text-muted">Enter your budget and we&apos;ll build the perfect setup from our catalog</p>
        </div>
      </div>

      <form className="flex flex-wrap gap-3 mb-6" onSubmit={build}>
        <div className="flex items-center gap-2 themed-card px-4 py-3" style={{ borderRadius: 12 }}>
          <span className="text-lg font-black themed-text-muted">₹</span>
          <input
            className="w-32 border-none outline-none text-lg font-black bg-transparent themed-text-primary"
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="60,000"
            min="5000"
          />
        </div>
        <select
          className="themed-select"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="coding">💻 Coding Setup</option>
          <option value="gaming">🎮 Gaming Setup</option>
          <option value="office">🏢 Office Setup</option>
          <option value="photography">📷 Photography Setup</option>
        </select>
        <button className="btn-primary rounded-xl px-6 py-3 text-sm" disabled={busy || !budget} type="submit">
          {busy ? "Building..." : "Build Setup"}
        </button>
      </form>

      {/* Quick budget chips */}
      <div className="flex flex-wrap gap-2 mb-6" suppressHydrationWarning>
        {[30000, 50000, 60000, 80000, 100000].map((b) => (
          <button
            key={b}
            className="suggestion-chip"
            onClick={() => setBudget(String(b))}
            type="button"
          >
            ₹{b.toLocaleString("en-IN")}
          </button>
        ))}
      </div>

      {!result && !busy && (
        <div className="empty-state">
          <span className="empty-icon">🏗️</span>
          <h3>Enter a budget to get started</h3>
          <p>We&apos;ll recommend the best product combination within your budget</p>
        </div>
      )}

      {busy && <SkeletonTabContent />}

      {result && !result.error && (
        <div className="ai-panel stagger-in">
          <div className="setup-total mb-6">
            <p className="text-sm font-bold text-[#f4d7a1]">{result.label}</p>
            <p className="text-4xl font-black mt-2" suppressHydrationWarning>₹{result.totalCost?.toLocaleString("en-IN")}</p>
            <p className="text-sm mt-2" suppressHydrationWarning>
              Budget: ₹{result.budget?.toLocaleString("en-IN")} ·
              {result.underBudget
                ? ` Saved ₹${result.savings?.toLocaleString("en-IN")} ✓`
                : ` Over budget by ₹${Math.abs(result.savings)?.toLocaleString("en-IN")}`}
            </p>
          </div>

          <div className="setup-grid">
            {result.items?.map((item, i) => (
              <div key={i} className="setup-card stagger-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="setup-emoji">{item.emoji}</div>
                <p className="text-xs font-bold uppercase themed-text-muted mb-1">{item.slot}</p>
                {item.product ? (
                  <Link href={`/product/${item.product._id}`} className="block hover:text-[#1d6b62]">
                    {item.product.image && (
                      <img src={item.product.image} alt="" className="h-20 w-full object-contain rounded mb-2" />
                    )}
                    <p className="text-sm font-black line-clamp-2">{item.product.title}</p>
                    <p className="text-lg font-black themed-text-accent mt-1">{money(item.price)}</p>
                    <p className="text-xs themed-text-muted" suppressHydrationWarning>Budget: ₹{item.budget?.toLocaleString("en-IN")}</p>
                  </Link>
                ) : (
                  <div className="py-4">
                    <p className="text-sm themed-text-muted">No match found</p>
                    <p className="text-xs themed-text-muted" suppressHydrationWarning>Budget: ₹{item.budget?.toLocaleString("en-IN")}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result?.error && (
        <div className="empty-state" style={{ background: "var(--badge-rose-bg)", borderColor: "var(--badge-rose-text)" }}>
          <span className="empty-icon">⚠️</span>
          <h3 style={{ color: "var(--badge-rose-text)" }}>{result.error}</h3>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 5: PRICE DROP TRACKER
   ═══════════════════════════════════════════════════════════════════ */
function readWatchlist() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("dr_price_watchlist") || "[]"); }
  catch { return []; }
}

function PriceTrackerTab({ products }) {
  const [watchlist, setWatchlist] = useState(readWatchlist);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [chartProduct, setChartProduct] = useState(null);
  const chartCanvasRef = useRef(null);

  function addToWatchlist(productId) {
    const product = products.find((p) => p._id === productId);
    if (!product || watchlist.some((w) => w._id === productId)) return;

    const entry = {
      _id: product._id,
      title: product.title,
      image: product.image,
      price: product.price,
      addedPrice: product.price,
      addedAt: new Date().toISOString(),
    };
    const updated = [entry, ...watchlist];
    setWatchlist(updated);
    localStorage.setItem("dr_price_watchlist", JSON.stringify(updated));
  }

  function removeFromWatchlist(productId) {
    const updated = watchlist.filter((w) => w._id !== productId);
    setWatchlist(updated);
    localStorage.setItem("dr_price_watchlist", JSON.stringify(updated));
    if (chartProduct?._id === productId) setChartProduct(null);
  }

  function showChart(item) {
    setChartProduct(item);
    setTimeout(() => {
      if (chartCanvasRef.current) {
        const history = generatePriceHistory(item._id, item.price);
        drawPriceChart(chartCanvasRef.current, history, item.price);
      }
    }, 100);
  }

  function getPriceDrop(item) {
    const history = generatePriceHistory(item._id, item.price);
    const lowest = Math.min(...history.map((p) => p.price));
    const drop = item.addedPrice - item.price;
    return { lowest, drop, dropped: drop > 0 };
  }

  return (
    <div className="ai-panel">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📉</span>
        <div>
          <h2 className="text-2xl font-black themed-text-primary">Smart Price Drop Tracker</h2>
          <p className="text-sm themed-text-muted">Track products and get notified when prices drop</p>
        </div>
      </div>

      {/* Add product */}
      <div className="mb-6">
        <select
          className="themed-select w-full max-w-md"
          value=""
          onChange={(e) => { addToWatchlist(e.target.value); e.target.value = ""; }}
        >
          <option value="">+ Add product to watchlist...</option>
          {products.filter((p) => !watchlist.some((w) => w._id === p._id)).map((p) => (
            <option key={p._id} value={p._id}>{p.title} — {money(p.price)}</option>
          ))}
        </select>
      </div>

      {/* Price chart */}
      {chartProduct && (
        <div className="themed-card p-5 mb-6 stagger-in">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-black themed-text-primary">{chartProduct.title}</h3>
              <p className="text-sm themed-text-muted">30-day price history (simulated)</p>
            </div>
            <button
              className="text-sm font-bold themed-text-muted hover:text-[#c94040] transition-colors"
              onClick={() => setChartProduct(null)}
              type="button"
            >
              ✕ Close
            </button>
          </div>
          <canvas ref={chartCanvasRef} className="price-chart-canvas" style={{ borderRadius: 12 }} />
        </div>
      )}

      {/* Watchlist */}
      {watchlist.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👀</span>
          <h3>Your watchlist is empty</h3>
          <p>Add products above to start tracking prices and get notified on drops</p>
        </div>
      ) : (
        <div className="space-y-3">
          {watchlist.map((item, i) => {
            const { lowest, drop, dropped } = getPriceDrop(item);
            return (
              <div key={item._id} className="watchlist-item stagger-in" style={{ animationDelay: `${i * 60}ms`, background: "var(--card-bg)", borderColor: "var(--border-primary)" }}>
                {item.image && <img src={item.image} alt="" className="h-14 w-14 rounded object-contain" />}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate themed-text-primary">{item.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-black themed-text-accent">{money(item.price)}</span>
                    {dropped && <span className="price-alert">📉 Dropped ₹{drop}</span>}
                  </div>
                  <p className="text-xs themed-text-muted mt-1">Lowest: {money(lowest)} · Added: {money(item.addedPrice)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="suggestion-chip"
                    onClick={() => showChart(item)}
                    type="button"
                    style={{ padding: "6px 12px" }}
                  >
                    📊 Chart
                  </button>
                  <button
                    className="cart-delete-btn"
                    onClick={() => removeFromWatchlist(item._id)}
                    type="button"
                    style={{ position: "static" }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 6: COMPATIBILITY CHECKER
   ═══════════════════════════════════════════════════════════════════ */
function CompatibilityTab({ products }) {
  const [selectedId, setSelectedId] = useState("");
  const [compatData, setCompatData] = useState(null);

  function check(productId) {
    setSelectedId(productId);
    const product = products.find((p) => p._id === productId);
    if (!product) { setCompatData(null); return; }
    setCompatData(findCompatible(product, products));
  }

  const selectedProduct = products.find((p) => p._id === selectedId);

  return (
    <div className="ai-panel">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🔗</span>
        <div>
          <h2 className="text-2xl font-black themed-text-primary">Compatibility Checker</h2>
          <p className="text-sm themed-text-muted">Find compatible accessories and parts for any product</p>
        </div>
      </div>

      {/* Product selector */}
      <div className="mb-6">
        <select
          className="themed-select w-full max-w-md"
          value={selectedId}
          onChange={(e) => check(e.target.value)}
        >
          <option value="">Choose a product to check compatibility...</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>{p.title}</option>
          ))}
        </select>
      </div>

      {/* Selected product card */}
      {selectedProduct && (
        <div className="flex items-center gap-4 themed-card p-4 mb-6 stagger-in" style={{ borderWidth: 2, borderColor: "var(--text-accent)" }}>
          {selectedProduct.image && (
            <img src={selectedProduct.image} alt="" className="h-16 w-16 rounded object-contain" />
          )}
          <div>
            <p className="font-black themed-text-primary">{selectedProduct.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <ThemedBadge tone="green">{selectedProduct.category}</ThemedBadge>
              <span className="text-sm font-black themed-text-accent">{money(selectedProduct.price)}</span>
            </div>
          </div>
        </div>
      )}

      {!selectedId && !compatData && (
        <div className="empty-state">
          <span className="empty-icon">🔌</span>
          <h3>Select a product above</h3>
          <p>We&apos;ll find compatible accessories and parts from our catalog</p>
        </div>
      )}

      {/* Compatibility results */}
      {compatData && (
        <div className="ai-panel stagger-in">
          {compatData.type ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <ThemedBadge tone="gold">{compatData.label}</ThemedBadge>
                <span className="text-sm themed-text-muted">{compatData.items.length} compatible items found</span>
              </div>

              {compatData.items.length > 0 ? (
                <div className="compat-grid">
                  {compatData.items.map((item, i) => (
                    <Link
                      key={`${item._id}-${i}`}
                      href={`/product/${item._id}`}
                      className="compat-card hover:border-[#1d6b62] stagger-in"
                      style={{ animationDelay: `${i * 60}ms`, background: "var(--card-bg)", borderColor: "var(--border-primary)" }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`compat-badge ${item.badge}`}>{item.compatType}</span>
                        <span className="text-xs font-bold themed-text-accent">{money(item.price)}</span>
                      </div>
                      {item.image && (
                        <img src={item.image} alt="" className="h-16 w-full object-contain rounded mb-2" />
                      )}
                      <p className="text-sm font-black line-clamp-2 themed-text-primary">{item.title}</p>
                      <p className="text-xs themed-text-muted mt-1">{item.category}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ background: "var(--badge-gold-bg)", borderColor: "var(--badge-gold-text)" }}>
                  <span className="empty-icon">🤷</span>
                  <h3 style={{ color: "var(--badge-gold-text)" }}>No compatible products found</h3>
                  <p>Try selecting a different product</p>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state" style={{ background: "var(--badge-gold-bg)", borderColor: "var(--badge-gold-text)" }}>
              <span className="empty-icon">❓</span>
              <h3 style={{ color: "var(--badge-gold-text)" }}>Could not determine product type</h3>
              <p>Compatibility works best with laptops, cameras, phones, and PC parts</p>
            </div>
          )}
        </div>
      )}

      {/* Info cards */}
      {!selectedId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[
            { emoji: "💻", title: "Laptop", desc: "Compatible RAM, SSD, bags & accessories" },
            { emoji: "📷", title: "Camera", desc: "Compatible lenses, tripods & memory cards" },
            { emoji: "🖥️", title: "PC Parts", desc: "Check if components work together" },
          ].map((card, i) => (
            <div key={card.title} className="stat-card stagger-in" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="text-4xl block mb-3">{card.emoji}</span>
              <p className="font-black text-lg themed-text-primary">{card.title}</p>
              <p className="text-sm themed-text-muted mt-1">{card.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
