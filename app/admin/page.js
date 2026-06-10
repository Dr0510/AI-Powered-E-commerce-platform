"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast, ToastContainer } from "@/components/Toast";
import AdminLayout from "@/components/AdminLayout";
import AdminStatsCard from "@/components/AdminStatsCard";
import AdminProductModal from "@/components/AdminProductModal";

// Dynamically import Cloudinary widget to prevent build-time errors
const CldUploadWidget = dynamic(() => import("next-cloudinary").then(mod => ({ default: mod.CldUploadWidget })), { ssr: false });

const emptyProduct = {
  title: "",
  description: "",
  price: "",
  category: "General",
  stock: 10,
  tags: "",
  active: true,
  images: [],
};

const fulfillmentOptions = ["unfulfilled", "packed", "shipped", "delivered", "cancelled"];

// ─── Data Fetching ───
async function fetchAdminData() {
  try {
    const authData = await api("/api/auth/me");
    if (!authData || !authData.user) {
      return { user: null, needsSignIn: true, stats: null, products: [], orders: [], users: [] };
    }
    if (authData.user.role !== "admin") {
      return { user: authData.user, needsAdmin: true, stats: null, products: [], orders: [], users: [] };
    }

    let statsData = { products: 0, users: 0, orders: 0, revenue: 0, recentUsers: [] };
    let productData = { products: [] };
    let orderData = { orders: [] };

    try { statsData = await api("/api/admin/stats"); } catch (e) { console.error("Failed to fetch admin stats:", e.message); }
    try { productData = await api("/api/products?includeInactive=true"); } catch (e) { console.error("Failed to fetch products:", e.message); }
    try { orderData = await api("/api/orders?admin=true"); } catch (e) { console.error("Failed to fetch orders:", e.message); }

    return {
      user: authData.user,
      stats: statsData,
      products: (productData && productData.products) || [],
      orders: (orderData && orderData.orders) || [],
      users: (statsData && statsData.recentUsers) || [],
    };
  } catch (error) {
    console.error("fetchAdminData failed:", error.message);
    return { user: null, needsSignIn: false, needsAdmin: false, stats: null, products: [], orders: [], users: [], error: error.message };
  }
}

// ─── Seller Management Panel ───
function SellerManagementPanel({ showToast }) {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  async function loadSellers() {
    try {
      const data = await api("/api/admin/sellers");
      setSellers(data.sellers || []);
    } catch (error) {
      showToast?.(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSellers(); }, []);

  async function updateSeller(sellerId, updates) {
    setBusy(true);
    try {
      await api("/api/admin/sellers", { method: "PATCH", body: JSON.stringify({ sellerId, ...updates }) });
      showToast?.("Seller updated", "success");
      await loadSellers();
    } catch (error) {
      showToast?.(error.message, "error");
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  }

  if (loading) return <LoadingSpinner size="sm" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">Sellers</h2>
          <p className="text-xs text-[var(--text-muted)]">{sellers.length} registered</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {sellers.filter(s => s.verification_status === "pending").length} pending
        </span>
      </div>

      {sellers.length === 0 ? (
        <div className="empty-state">
          <span className="text-4xl mb-3">🏪</span>
          <h3>No sellers yet</h3>
          <p>Sellers will appear here once they register.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
          {sellers.map((seller) => (
            <div key={seller.id} className="group relative rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-4 hover:shadow-md transition-all duration-200">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-green)]/20 to-[var(--brand-green-bright)]/20 flex items-center justify-center text-lg flex-shrink-0">
                    🏪
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-sm text-[var(--text-primary)]">{seller.shop_name}</p>
                      {seller.verification_badge && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                          ✓ Verified
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        seller.verification_status === "verified" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                        seller.verification_status === "rejected" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                        "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        {seller.verification_status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{seller.owner_name} · {seller.owner_email}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-[var(--text-muted)]">
                      <span>📦 {seller.product_count || 0} products</span>
                      <span>⭐ {seller.review_count || 0} reviews</span>
                      <span>💰 ₹{Number(seller.total_earnings || 0).toLocaleString('en-IN')}</span>
                      <span>👥 {seller.followers_count || 0} followers</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {seller.verification_status === "pending" && (
                    <div className="flex gap-1.5">
                      <button
                        disabled={busy}
                        onClick={() => setConfirmAction({ id: seller.id, action: "verified" })}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all"
                      >
                        ✓ Approve
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => setConfirmAction({ id: seller.id, action: "rejected" })}
                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 disabled:opacity-50 transition-all"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                  <select
                    value={seller.subscription_plan}
                    onChange={(e) => updateSeller(seller.id, { subscriptionPlan: e.target.value })}
                    disabled={busy}
                    className="themed-select !py-1.5 !px-2 !text-[11px] !rounded-lg !w-20"
                  >
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                  </select>
                  <input
                    type="number"
                    defaultValue={seller.commission_rate}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val >= 0 && val <= 100) updateSeller(seller.id, { commissionRate: val });
                    }}
                    className="w-14 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-2 py-1.5 text-[11px] font-bold text-[var(--text-primary)]"
                    placeholder="%"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              {/* Confirm dialog */}
              {confirmAction && confirmAction.id === seller.id && (
                <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {confirmAction.action === "verified" ? "Approve this seller?" : "Reject this seller?"}
                  </span>
                  <button
                    onClick={() => updateSeller(seller.id, { verificationStatus: confirmAction.action })}
                    className="px-3 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 transition-all"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-3 py-1 rounded-lg border border-[var(--border-primary)] text-[11px] font-bold text-[var(--text-muted)] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton Loader ───
function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5">
            <div className="skeleton w-20 h-3 mb-3" />
            <div className="skeleton w-28 h-8 mb-2" />
            <div className="skeleton w-16 h-5" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6">
          <div className="skeleton w-32 h-5 mb-6" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton w-full h-12 mb-3" />
          ))}
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6">
          <div className="skeleton w-28 h-5 mb-6" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton w-full h-32" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ───
function AdminEmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--brand-green)]/10 to-[var(--brand-green-bright)]/10 flex items-center justify-center text-4xl mb-4 animate-float">
        {icon}
      </div>
      <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">{message}</p>
      {action}
    </div>
  );
}

// ─── Main Admin Page ───
export default function AdminPage() {
  // State
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [accessState, setAccessState] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cloudinaryConfig, setCloudinaryConfig] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const itemsPerPage = 8;

  const { toast, showToast } = useToast();
  const canUpload = Boolean(cloudinaryConfig?.cloudName && cloudinaryConfig?.apiKey);

  // Load data functions
  const loadAdmin = useCallback(async () => {
    setLoadError("");
    setAccessState("loading");
    try {
      const data = await fetchAdminData();
      setAdminUser(data.user);
      if (data.needsSignIn) { setAccessState("signed-out"); return; }
      if (data.needsAdmin) { setAccessState("forbidden"); return; }
      setStats(data.stats);
      setProducts(data.products);
      setOrders(data.orders);
      setUsers(data.users);
      setAccessState("ready");
    } catch (error) {
      setAccessState("error");
      setLoadError(error.message);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchAdminData().then((data) => {
      if (!active) return;
      setAdminUser(data.user);
      if (data.needsSignIn) { setAccessState("signed-out"); return; }
      if (data.needsAdmin) { setAccessState("forbidden"); return; }
      setStats(data.stats);
      setProducts(data.products);
      setOrders(data.orders);
      setUsers(data.users);
      setAccessState("ready");
    }).catch((error) => {
      if (active) { setAccessState("error"); setLoadError(error.message); }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    api("/api/cloudinary/config").then((config) => {
      if (active) setCloudinaryConfig(config);
    }).catch((error) => {
      if (active) showToast(error.message, "error");
    });
    return () => { active = false; };
  }, []);

  // Computed values
  const activeProducts = useMemo(() => products.filter((p) => p.active !== false).length, [products]);
  const totalRevenue = useMemo(() => stats?.revenue || 0, [stats]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (productFilter === "active") filtered = filtered.filter(p => p.active !== false);
    else if (productFilter === "inactive") filtered = filtered.filter(p => p.active === false);
    else if (productFilter === "low-stock") filtered = filtered.filter(p => p.stock <= 5);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    return filtered;
  }, [products, productFilter, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Product handlers
  function editProduct(product) {
    setEditingId(product._id);
    setForm({
      title: product.title || "",
      description: product.description || "",
      price: product.price || "",
      category: product.category || "General",
      stock: product.stock || 0,
      tags: (product.tags || []).join(", "),
      active: product.active !== false,
      images: product.images || [],
    });
    setShowProductModal(true);
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyProduct);
    setUploadProgress(0);
  }

  async function saveProduct(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const image = form.images?.[0]?.url || "";
      if (!image) throw new Error("Product image is required");
      const payload = {
        title: form.title, description: form.description, price: form.price,
        category: form.category, stock: form.stock, tags: form.tags, active: form.active, image, images: form.images,
      };
      const saved = await api(editingId ? `/api/products/${editingId}` : "/api/products", {
        method: editingId ? "PATCH" : "POST", body: JSON.stringify(payload),
      });
      setProducts((current) => {
        const exists = current.some((p) => p._id === saved.product._id);
        return exists ? current.map((p) => (p._id === saved.product._id ? saved.product : p)) : [saved.product, ...current];
      });
      resetForm();
      setShowProductModal(false);
      showToast(editingId ? "Product updated" : "Product created", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function archiveProduct(productId) {
    setBusy(true);
    try {
      await api(`/api/products/${productId}`, { method: "DELETE" });
      setProducts((current) => current.filter((p) => p._id !== productId));
      showToast("Product archived", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function updateProductStock(productId, stock) {
    const nextStock = Math.max(0, Math.floor(Number(stock || 0)));
    try {
      const saved = await api(`/api/products/${productId}`, {
        method: "PATCH", body: JSON.stringify({ stock: nextStock }),
      });
      setProducts((current) => current.map((p) => (p._id === productId ? saved.product : p)));
      showToast(nextStock === 0 ? "Out of Stock" : "Stock updated", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function updateOrder(orderId, fulfillmentStatus) {
    setBusy(true);
    try {
      const data = await api("/api/orders", {
        method: "PATCH", body: JSON.stringify({ orderId, fulfillmentStatus }),
      });
      setOrders((current) => current.map((o) => (o._id === orderId ? data.order : o)));
      showToast("Order updated", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  function handleUpload(result) {
    const info = result.info;
    if (!info?.secure_url) { showToast("Upload failed", "error"); return; }
    setForm((current) => ({
      ...current,
      images: [{ url: info.secure_url, publicId: info.public_id, width: info.width, height: info.height, alt: current.title || "Product image" }],
    }));
    setUploadProgress(0);
    showToast("Image uploaded", "success", 2000);
  }

  function handleUploadStart() { setUploadProgress(30); }
  function removeImage() { setForm((c) => ({ ...c, images: [] })); setUploadProgress(0); }

  // ─── RENDER ───
  const content = (
    <div className="space-y-8 animate-fade-in">
      {/* Access states */}
      {accessState === "signed-out" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center text-5xl mb-6">
            🔒
          </div>
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">Sign in required</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md">
            Please sign in with an admin account to access the dashboard.
          </p>
        </div>
      )}

      {accessState === "forbidden" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center text-5xl mb-6">
            🚫
          </div>
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">Admin access required</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md">
            {adminUser?.email || "This account"} is signed in, but not listed as admin.
          </p>
        </div>
      )}

      {accessState === "error" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center text-5xl mb-6">
            ⚠️
          </div>
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">Unable to load data</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md">{loadError || "Something went wrong."}</p>
          <button onClick={() => loadAdmin()} className="px-6 py-2.5 rounded-xl bg-[var(--brand-green)] text-white text-sm font-bold hover:bg-[var(--brand-green-bright)] transition-all" type="button">
            Try again
          </button>
        </div>
      )}

      {/* Loading state */}
      {accessState === "loading" && <AdminSkeleton />}

      {/* Main dashboard content */}
      {accessState === "ready" && (
        <>
          {/* ─── STATS SECTION ─── */}
          {stats && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-black text-[var(--text-primary)]">Overview</h2>
                  <p className="text-xs text-[var(--text-muted)]">Your store at a glance</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-all"
                    onClick={() => loadAdmin()}
                    disabled={busy}
                    type="button"
                  >
                    🔄 Refresh
                  </button>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Live
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-children">
                <AdminStatsCard label="Revenue" value={money(totalRevenue)} icon="💰" gradient="teal" trend={12.5} trendLabel="last month" />
                <AdminStatsCard label="Orders" value={stats.orders} icon="🛒" gradient="blue" trend={8.2} trendLabel="last month" />
                <AdminStatsCard label="Active Products" value={activeProducts} icon="📦" gradient="amber" trend={-3.1} trendLabel="last month" />
                <AdminStatsCard label="Users" value={stats.users} icon="👥" gradient="purple" trend={15.7} trendLabel="last month" />
              </div>
            </section>
          )}

          {/* ─── PRODUCTS SECTION ─── */}
          <section id="products-section">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-[var(--text-primary)]">Products</h2>
                <p className="text-xs text-[var(--text-muted)]">{products.length} total · {activeProducts} active</p>
              </div>
              <button
                onClick={() => { resetForm(); setShowProductModal(true); }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white text-xs font-bold hover:shadow-lg hover:shadow-[var(--brand-green)]/25 transition-all flex items-center gap-1.5"
                type="button"
              >
                ➕ New Product
              </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">🔍</span>
                <input
                  className="themed-input !pl-9 !py-2 !text-sm"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { key: "all", label: "All" },
                  { key: "active", label: "Active" },
                  { key: "inactive", label: "Inactive" },
                  { key: "low-stock", label: "Low Stock" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { setProductFilter(f.key); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      productFilter === f.key
                        ? "bg-[var(--brand-green)] text-white"
                        : "bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    }`}
                    type="button"
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            {paginatedProducts.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                <AdminEmptyState
                  icon="📦"
                  title={searchQuery ? "No matches found" : "No products yet"}
                  message={searchQuery ? `No products matching "${searchQuery}"` : "Create your first product to start selling."}
                  action={
                    !searchQuery && (
                      <button
                        onClick={() => { resetForm(); setShowProductModal(true); }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white text-sm font-bold hover:shadow-lg transition-all"
                        type="button"
                      >
                        ➕ Create Product
                      </button>
                    )
                  }
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] overflow-hidden">
                <div className="hidden md:grid grid-cols-[40px_2fr_1fr_1fr_1fr_100px] gap-4 px-5 py-3 border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <span /><span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Actions</span>
                </div>
                <div className="divide-y divide-[var(--border-subtle)]">
                  {paginatedProducts.map((product, idx) => (
                    <div key={product._id} className={`grid grid-cols-1 md:grid-cols-[40px_2fr_1fr_1fr_1fr_100px] gap-3 md:gap-4 p-4 md:px-5 md:py-3 items-center hover:bg-[var(--tab-hover-bg)] transition-all ${product.active === false ? "opacity-60" : ""}`} style={{ animationDelay: `${idx * 30}ms` }}>
                      <div className="hidden md:block">
                        {product.image ? (
                          <img alt="" className="w-9 h-9 rounded-lg object-contain bg-[var(--surface-secondary)]" src={product.image} />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center text-xs text-[var(--text-muted)]">📷</div>
                        )}
                      </div>
                      <div className="flex items-start gap-3 md:gap-0 md:items-center md:block">
                        <div className="md:hidden">
                          {product.image ? (
                            <img alt="" className="w-12 h-12 rounded-lg object-contain bg-[var(--surface-secondary)]" src={product.image} />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center text-sm">📷</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-[var(--text-primary)] truncate">{product.title}</p>
                            {product.active === false && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">Archived</span>}
                          </div>
                          <div className="md:hidden flex flex-wrap gap-2 mt-1.5">
                            <span className="text-xs text-[var(--text-muted)]">{product.category}</span>
                            <span className="font-bold text-xs text-[var(--text-primary)]">{money(product.price)}</span>
                            <span className={`text-xs font-bold ${product.stock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                              {product.stock > 0 ? `${product.stock} units` : "OOS"}
                            </span>
                          </div>
                          <div className="md:hidden flex gap-1.5 mt-2">
                            <button onClick={() => editProduct(product)} className="px-2.5 py-1 rounded-lg bg-[var(--surface-secondary)] text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--tab-hover-bg)] transition-all" type="button">✏️ Edit</button>
                            <button onClick={() => archiveProduct(product._id)} className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all" type="button">🗑️ Archive</button>
                            <div className="flex items-center gap-1">
                              <input className="w-14 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-2 py-1 text-xs font-bold text-[var(--text-primary)]" disabled={busy} min="0" onKeyDown={(e) => { if (e.key === "Enter") updateProductStock(product._id, e.currentTarget.value); }} placeholder="Stock" type="number" defaultValue={product.stock} />
                              <button onClick={(e) => updateProductStock(product._id, e.currentTarget.previousElementSibling.value)} className="px-2 py-1 rounded-lg bg-[var(--brand-green)] text-white text-[11px] font-bold hover:bg-[var(--brand-green-bright)] transition-all" type="button">Set</button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:block text-sm text-[var(--text-secondary)]">{product.category}</div>
                      <div className="hidden md:block text-sm font-bold text-[var(--text-primary)]">{money(product.price)}</div>
                      <div className="hidden md:flex items-center gap-2">
                        <input className="w-16 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-2 py-1 text-xs font-bold text-[var(--text-primary)]" disabled={busy} min="0" onKeyDown={(e) => { if (e.key === "Enter") updateProductStock(product._id, e.currentTarget.value); }} placeholder="Qty" type="number" defaultValue={product.stock} />
                        <span className={`text-xs font-bold ${product.stock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{product.stock > 0 ? `(${product.stock})` : "OOS"}</span>
                      </div>
                      <div className="hidden md:flex items-center gap-1.5">
                        <button onClick={() => editProduct(product)} className="px-2.5 py-1.5 rounded-lg bg-[var(--surface-secondary)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--tab-hover-bg)] transition-all" type="button" title="Edit">✏️</button>
                        <button onClick={() => archiveProduct(product._id)} disabled={busy || product.active === false} className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-30 transition-all" type="button" title="Archive">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-subtle)]">
                    <p className="text-xs text-[var(--text-muted)]">
                      Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] disabled:opacity-30 transition-all" type="button">← Prev</button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
                        return (
                          <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? "bg-[var(--brand-green)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"}`} type="button">{pageNum}</button>
                        );
                      })}
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] disabled:opacity-30 transition-all" type="button">Next →</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ─── ORDERS SECTION ─── */}
          <section id="orders-section">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-[var(--text-primary)]">Orders</h2>
                <p className="text-xs text-[var(--text-muted)]">{orders.length} total orders</p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                <AdminEmptyState icon="🛒" title="No orders yet" message="Customer orders will appear here." />
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] overflow-hidden">
                <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1.5fr_auto] gap-4 px-5 py-3 border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <span>Order</span><span>Customer</span><span>Total</span><span>Fulfillment</span><span>Items</span>
                </div>
                <div className="divide-y divide-[var(--border-subtle)]">
                  {orders.map((order) => (
                    <div key={order._id} className="p-4 md:px-5 md:py-3 hover:bg-[var(--tab-hover-bg)] transition-all cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}>
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1.5fr_auto] gap-2 md:gap-4 items-center">
                        <div>
                          <p className="font-bold text-sm text-[var(--text-primary)]">#{order._id.slice(-8)}</p>
                          <p className="text-xs text-[var(--text-muted)]">{new Date(order.createdAt || order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="hidden md:block">
                          <p className="text-sm text-[var(--text-secondary)]">{order.customer?.name || "Customer"}</p>
                          <p className="text-xs text-[var(--text-muted)]">{order.customer?.email}</p>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[var(--text-primary)]">{money(order.total)}</p>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${order.status === "paid" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : order.status === "cancelled" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="hidden md:flex items-center gap-2">
                          <select className="themed-select !py-1.5 !px-2 !text-xs !rounded-lg" disabled={busy} onChange={(e) => updateOrder(order._id, e.target.value)} value={order.fulfillmentStatus} onClick={(e) => e.stopPropagation()}>
                            {fulfillmentOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
                          </select>
                        </div>
                        <div className="hidden md:flex items-center gap-1.5">
                          <span className="px-2 py-1 rounded-lg bg-[var(--surface-secondary)] text-xs font-bold text-[var(--text-secondary)]">{order.items?.length || 0} items</span>
                        </div>
                      </div>
                      {expandedOrder === order._id && (
                        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-3 md:hidden">
                          <div className="grid grid-cols-2 gap-3">
                            <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Customer</p><p className="text-sm text-[var(--text-secondary)]">{order.customer?.name || "N/A"}</p></div>
                            <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Email</p><p className="text-sm text-[var(--text-secondary)] truncate">{order.customer?.email || "N/A"}</p></div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">Fulfillment</p>
                            <select className="themed-select !py-1.5 !px-2 !text-xs !rounded-lg w-full" disabled={busy} onChange={(e) => updateOrder(order._id, e.target.value)} value={order.fulfillmentStatus}>
                              {fulfillmentOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ─── SELLERS SECTION ─── */}
          <section id="sellers-section">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 md:p-6">
              <SellerManagementPanel showToast={showToast} />
            </div>
          </section>

          {/* ─── USERS SECTION ─── */}
          <section id="users-section">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-[var(--text-primary)]">Users</h2>
                <p className="text-xs text-[var(--text-muted)]">Latest customers · Total: {stats?.users || 0}</p>
              </div>
              <button onClick={() => setShowUserModal(!showUserModal)} className="text-xs font-bold text-[var(--text-accent)] hover:underline" type="button">
                {showUserModal ? "Collapse" : "View all"}
              </button>
            </div>

            {users.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                <AdminEmptyState icon="👥" title="No users yet" message="Users will appear once they sign up or place orders." />
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)]">
                        {["Name", "Email", "Role", "Orders", "Spent", "Joined"].map((h) => (
                          <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {(showUserModal ? users : users.slice(0, 5)).map((user) => (
                        <tr key={user._id} className="hover:bg-[var(--tab-hover-bg)] transition-all">
                          <td className="px-5 py-3 font-bold text-sm text-[var(--text-primary)] whitespace-nowrap">{user.name || "Customer"}</td>
                          <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">{user.email || "—"}</td>
                          <td className="px-5 py-3">
                            <span className="inline-flex px-2 py-0.5 rounded-lg bg-[var(--surface-secondary)] text-xs font-bold text-[var(--text-secondary)] uppercase">{user.role}</span>
                          </td>
                          <td className="px-5 py-3 font-bold text-sm text-[var(--text-primary)]">{user.orderCount}</td>
                          <td className="px-5 py-3 font-bold text-sm text-[var(--text-primary)]">{money((user.totalSpentInPaise || 0) / 100)}</td>
                          <td className="px-5 py-3 text-sm text-[var(--text-muted)] whitespace-nowrap" suppressHydrationWarning>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );

  return (
    <AdminLayout>
      {content}

      {/* Product Modal */}
      <AdminProductModal
        isOpen={showProductModal}
        onClose={() => { setShowProductModal(false); resetForm(); }}
        form={form}
        setForm={setForm}
        editingId={editingId}
        busy={busy}
        uploadProgress={uploadProgress}
        cloudinaryConfig={cloudinaryConfig}
        canUpload={canUpload}
        handleUpload={handleUpload}
        handleUploadStart={handleUploadStart}
        removeImage={removeImage}
        resetForm={resetForm}
        saveProduct={saveProduct}
      />

      <ToastContainer toast={toast} />
    </AdminLayout>
  );
}