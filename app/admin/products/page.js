"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import AdminLayout from "@/components/AdminLayout";
import AdminStatsCard from "@/components/AdminStatsCard";
import AdminProductModal from "@/components/AdminProductModal";

const CldUploadWidget = dynamic(() => import("next-cloudinary").then(mod => ({ default: mod.CldUploadWidget })), { ssr: false });

const emptyProduct = { title: "", description: "", price: "", category: "General", stock: 10, tags: "", active: true, images: [] };

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cloudinaryConfig, setCloudinaryConfig] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const itemsPerPage = 12;
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const canUpload = Boolean(cloudinaryConfig?.cloudName && cloudinaryConfig?.apiKey);

  const loadProducts = useCallback(async () => {
    try {
      const data = await api("/api/products?includeInactive=true");
      setProducts(data.products || []);
    } catch (e) { showToast(e.message, "error"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { api("/api/cloudinary/config").then(setCloudinaryConfig).catch(() => {}); }, []);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ["all", ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (search) { const q = search.toLowerCase(); result = result.filter(p => p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)); }
    if (categoryFilter !== "all") result = result.filter(p => p.category === categoryFilter);
    if (statusFilter === "active") result = result.filter(p => p.active !== false);
    else if (statusFilter === "inactive") result = result.filter(p => p.active === false);
    else if (statusFilter === "low-stock") result = result.filter(p => p.stock <= 5);
    if (sortBy === "oldest") result = [...result].reverse();
    else if (sortBy === "price-asc") result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "price-desc") result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0));
    return result;
  }, [products, search, categoryFilter, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginated = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const activeCount = products.filter(p => p.active !== false).length;

  function editProduct(p) {
    setEditingId(p._id);
    setForm({ title: p.title || "", description: p.description || "", price: p.price || "", category: p.category || "General", stock: p.stock || 0, tags: (p.tags || []).join(", "), active: p.active !== false, images: p.images || [] });
    setShowModal(true);
  }

  function resetForm() { setEditingId(""); setForm(emptyProduct); setUploadProgress(0); }

  async function saveProduct(e) {
    e.preventDefault(); setBusy(true);
    try {
      const image = form.images?.[0]?.url || "";
      if (!image) throw new Error("Product image is required");
      const payload = { title: form.title, description: form.description, price: form.price, category: form.category, stock: form.stock, tags: form.tags, active: form.active, image, images: form.images };
      const saved = await api(editingId ? `/api/products/${editingId}` : "/api/products", { method: editingId ? "PATCH" : "POST", body: JSON.stringify(payload) });
      setProducts(current => { const exists = current.some(p => p._id === saved.product._id); return exists ? current.map(p => p._id === saved.product._id ? saved.product : p) : [saved.product, ...current]; });
      resetForm(); setShowModal(false); showToast(editingId ? "Product updated" : "Product created");
    } catch (e) { showToast(e.message, "error"); } finally { setBusy(false); }
  }

  async function archiveProduct(id) {
    setBusy(true);
    try { await api(`/api/products/${id}`, { method: "DELETE" }); setProducts(current => current.filter(p => p._id !== id)); showToast("Product archived"); } catch (e) { showToast(e.message, "error"); } finally { setBusy(false); }
  }

  async function updateStock(id, stock) {
    const val = Math.max(0, Math.floor(Number(stock || 0)));
    try { const saved = await api(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify({ stock: val }) }); setProducts(current => current.map(p => p._id === id ? saved.product : p)); showToast(val === 0 ? "Out of Stock" : "Stock updated"); } catch (e) { showToast(e.message, "error"); }
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginated.length) { setSelectedIds(new Set()); } else { setSelectedIds(new Set(paginated.map(p => p._id))); }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  async function bulkArchive() {
    if (!confirm(`Archive ${selectedIds.size} products?`)) return;
    setBusy(true);
    try {
      for (const id of selectedIds) { await api(`/api/products/${id}`, { method: "DELETE" }); }
      setProducts(current => current.filter(p => !selectedIds.has(p._id)));
      setSelectedIds(new Set()); showToast(`${selectedIds.size} products archived`);
    } catch (e) { showToast(e.message, "error"); } finally { setBusy(false); }
  }

  function handleUpload(result) {
    const info = result.info;
    if (!info?.secure_url) { showToast("Upload failed", "error"); return; }
    setForm(c => ({ ...c, images: [{ url: info.secure_url, publicId: info.public_id, width: info.width, height: info.height, alt: c.title || "Product" }] }));
    setUploadProgress(0); showToast("Image uploaded");
  }

  if (loading) return <AdminLayout><div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5"><div className="skeleton w-full h-8 mb-2" /><div className="skeleton w-3/4 h-4" /></div>)}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-black text-[var(--text-primary)]">Products</h2><p className="text-xs text-[var(--text-muted)]">{products.length} total · {activeCount} active</p></div><button onClick={() => { resetForm(); setShowModal(true); }} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white text-xs font-bold hover:shadow-lg transition-all" type="button">➕ New Product</button></div>

        <div className="flex flex-wrap items-center gap-3">
          <input className="themed-input !py-2 !text-sm max-w-xs" placeholder="🔍 Search products..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          <select className="themed-select !py-2 !text-sm" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
            {categories.map(c => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
          </select>
          <div className="flex gap-1.5">
            {[{k:"all",l:"All"},{k:"active",l:"Active"},{k:"inactive",l:"Inactive"},{k:"low-stock",l:"Low Stock"}].map(f => <button key={f.k} onClick={() => { setStatusFilter(f.k); setCurrentPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter===f.k?"bg-[var(--brand-green)] text-white":"bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`} type="button">{f.l}</button>)}
          </div>
          <select className="themed-select !py-2 !text-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="price-asc">Price ↑</option><option value="price-desc">Price ↓</option>
          </select>
        </div>

        {selectedIds.size > 0 && <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20"><span className="text-xs font-bold text-blue-600">{selectedIds.size} selected</span><button onClick={bulkArchive} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold" type="button">🗑️ Archive Selected</button></div>}

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] overflow-hidden">
          <div className="hidden md:grid grid-cols-[40px_2fr_1fr_1fr_1fr_120px] gap-4 px-5 py-3 border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            <label className="flex items-center cursor-pointer"><input type="checkbox" checked={selectedIds.size === paginated.length && paginated.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded" /></label>
            <span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Actions</span>
          </div>

          <div className="divide-y divide-[var(--border-subtle)]">
            {paginated.length === 0 ? (
              <div className="py-16 text-center"><span className="text-4xl mb-4 block">📦</span><h3 className="font-black text-[var(--text-primary)]">No products found</h3><p className="text-sm text-[var(--text-muted)] mt-1">Try different filters or create a new product.</p></div>
            ) : paginated.map(p => (
              <div key={p._id} className="grid grid-cols-1 md:grid-cols-[40px_2fr_1fr_1fr_1fr_120px] gap-3 md:gap-4 p-4 md:px-5 md:py-3 items-center hover:bg-[var(--tab-hover-bg)] transition-all">
                <label className="hidden md:flex items-center"><input type="checkbox" checked={selectedIds.has(p._id)} onChange={() => toggleSelect(p._id)} className="w-4 h-4 rounded" /></label>
                <div className="flex items-center gap-3">
                  <label className="md:hidden flex items-center"><input type="checkbox" checked={selectedIds.has(p._id)} onChange={() => toggleSelect(p._id)} className="w-4 h-4 rounded" /></label>
                  {p.image ? <img alt="" className="w-12 h-12 rounded-lg object-contain bg-[var(--surface-secondary)]" src={p.image} /> : <div className="w-12 h-12 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center text-sm">📷</div>}
                  <div className="min-w-0"><p className="font-bold text-sm text-[var(--text-primary)] truncate">{p.title}</p>{p.active===false && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600">Archived</span>}</div>
                </div>
                <span className="text-sm text-[var(--text-secondary)]">{p.category}</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">{money(p.price)}</span>
                <span className={`text-sm font-bold ${p.stock > 0 ? "text-emerald-600" : "text-red-600"}`}>{p.stock > 0 ? `${p.stock} units` : "OOS"}</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => editProduct(p)} className="px-2.5 py-1.5 rounded-lg bg-[var(--surface-secondary)] text-xs font-bold hover:bg-[var(--tab-hover-bg)] transition-all" type="button">✏️</button>
                  <button onClick={() => archiveProduct(p._id)} disabled={busy} className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-xs font-bold text-rose-600 hover:bg-rose-500/20 transition-all" type="button">🗑️</button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-subtle)]"><p className="text-xs text-[var(--text-muted)]">Page {currentPage} of {totalPages}</p><div className="flex gap-1.5"><button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-bold disabled:opacity-30" type="button">←</button>{Array.from({length:Math.min(totalPages,5)},(_,i)=>{let n;if(totalPages<=5)n=i+1;else if(currentPage<=3)n=i+1;else if(currentPage>=totalPages-2)n=totalPages-4+i;else n=currentPage-2+i;return <button key={n} onClick={()=>setCurrentPage(n)} className={`w-8 h-8 rounded-lg text-xs font-bold ${currentPage===n?"bg-[var(--brand-green)] text-white":"hover:bg-[var(--surface-secondary)]"}`} type="button">{n}</button>})}<button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-bold disabled:opacity-30" type="button">→</button></div></div>}
        </div>
      </div>

      <AdminProductModal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} form={form} setForm={setForm} editingId={editingId} busy={busy} uploadProgress={uploadProgress} cloudinaryConfig={cloudinaryConfig} canUpload={canUpload} handleUpload={handleUpload} handleUploadStart={() => setUploadProgress(30)} removeImage={() => { setForm(c => ({...c, images:[]})); setUploadProgress(0); }} resetForm={resetForm} saveProduct={saveProduct} />

      {toast && <div className="fixed top-4 right-4 z-[9999] px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-lg text-sm font-bold animate-modal-enter">{toast.type==="error"?"❌":"✅"} {toast.msg}</div>}
    </AdminLayout>
  );
}