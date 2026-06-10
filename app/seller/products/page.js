"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { useToast, ToastContainer } from "@/components/Toast";

const CldUploadWidget = dynamic(() => import("next-cloudinary").then(mod => ({ default: mod.CldUploadWidget })), { ssr: false });

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", price: "", category: "General", stock: "", tags: "", images: [] });
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [cloudinaryConfig, setCloudinaryConfig] = useState(null);
  const { toasts, showToast, dismissToast } = useToast();

  const canUpload = Boolean(cloudinaryConfig?.cloudName && cloudinaryConfig?.apiKey);

  useEffect(() => {
    api("/api/cloudinary/config")
      .then(setCloudinaryConfig)
      .catch(e => showToast(e.message, "error"));
  }, []);

  async function loadProducts() {
    try {
      const data = await api("/api/sellers/products");
      setProducts(data.products);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProducts(); }, []);

  function resetForm() {
    setForm({ title: "", description: "", price: "", category: "General", stock: "", tags: "", images: [] });
    setEditingId("");
  }

  function editProduct(product) {
    setEditingId(product._id);
    setForm({
      title: product.title || "",
      description: product.description || "",
      price: product.price || "",
      category: product.category || "General",
      stock: product.stock || "",
      tags: (product.tags || []).join(", "),
      images: product.images || [],
    });
  }

  async function saveProduct(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const image = form.images?.[0]?.url || "";
      if (!image) {
        throw new Error("Product image is required - upload via Cloudinary");
      }
      const payload = { ...form, image, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) };
      if (editingId) {
        await api(`/api/sellers/products/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
        showToast("Product updated", "success");
      } else {
        await api("/api/sellers/products", { method: "POST", body: JSON.stringify(payload) });
        showToast("Product created", "success");
      }
      resetForm();
      await loadProducts();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(productId) {
    if (!confirm("Delete this product?")) return;
    setBusy(true);
    try {
      await api(`/api/sellers/products/${productId}`, { method: "DELETE" });
      showToast("Product deleted", "success");
      await loadProducts();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  function handleUpload(result) {
    const info = result.info;
    if (!info?.secure_url) {
      showToast("Upload failed - no secure URL", "error");
      return;
    }
    setForm((current) => ({
      ...current,
      images: [{ url: info.secure_url, publicId: info.public_id, width: info.width, height: info.height, alt: current.title || "Product image" }],
    }));
    showToast("Image uploaded successfully", "success", 2000);
  }

  function removeImage() {
    setForm((current) => ({ ...current, images: [] }));
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--brand-green)] border-t-transparent mx-auto" />
        <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">Loading products...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--brand-green)] text-white px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/seller/dashboard" className="text-xs font-bold opacity-80 hover:opacity-100">← Dashboard</Link>
            <h1 className="text-xl font-black mt-1">Manage Products</h1>
          </div>
          <span className="text-sm font-bold opacity-80">{products.length} products</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr_420px] gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black">Your Products</h2>
              {products.length > 0 && (
                <span className="text-xs font-bold text-[var(--text-muted)]">{products.filter(p => Number(p.stock) > 0).length} in stock</span>
              )}
            </div>
            {products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No products yet</h3>
                <p>Add your first product using the form on the right.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {products.map((product) => (
                  <div key={product._id} className="glass-panel rounded-xl p-4 flex gap-4 items-start hover:shadow-md transition-shadow">
                    <div className="h-20 w-20 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center shrink-0 overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt="" className="h-full w-full object-contain p-2" />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm truncate">{product.title}</p>
                      <p className="text-sm font-bold text-[var(--brand-green)]">₹{product.price}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${Number(product.stock) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {Number(product.stock) > 0 ? `${product.stock} in stock` : "Out of stock"}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">{product.category}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => editProduct(product)} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[var(--border-primary)] hover:bg-[var(--surface-secondary)]">
                        Edit
                      </button>
                      <button onClick={() => deleteProduct(product._id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel rounded-xl p-5 h-fit sticky top-6">
            <h2 className="font-black mb-4">{editingId ? "Edit Product" : "Add New Product"}</h2>
            <form onSubmit={saveProduct} className="space-y-3">
              <input className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Product Title *" required />
              <textarea className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm min-h-20" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" />
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.price} onChange={e => setForm({...form, price: e.target.value})} type="number" step="0.01" min="0" placeholder="Price (₹) *" required />
                <input className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} type="number" min="0" placeholder="Stock *" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Category" />
                <input className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="Tags (comma separated)" />
              </div>

              {/* Cloudinary Image Upload */}
              <div className="rounded-lg border border-[var(--border-primary)] p-3">
                <p className="mb-2 text-xs font-bold text-[var(--text-muted)]">Product Image</p>
                {form.images?.[0]?.url ? (
                  <div className="mb-3 relative">
                    <img alt="Product preview" className="h-32 w-full rounded-lg object-contain bg-[var(--surface-secondary)]" src={form.images[0].url} />
                    <button className="absolute top-2 right-2 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white hover:bg-red-600" onClick={(e) => { e.preventDefault(); removeImage(); }} type="button">Remove</button>
                  </div>
                ) : null}
                {canUpload && CldUploadWidget ? (
                  <CldUploadWidget
                    config={{ cloud: { cloudName: cloudinaryConfig.cloudName, apiKey: cloudinaryConfig.apiKey } }}
                    onSuccess={handleUpload}
                    options={{ folder: "dr-mart/seller-products", maxFiles: 1, multiple: false, resourceType: "image", clientAllowedFormats: ["jpg", "png", "webp"], sources: ["local", "camera"], maxFileSize: 5000000 }}
                    signatureEndpoint="/api/cloudinary/sign"
                  >
                    {({ open }) => (
                      <button className="w-full rounded bg-[var(--brand-green)] px-4 py-2 text-sm font-black text-white hover:opacity-90 disabled:opacity-50" onClick={() => open()} type="button">
                        {form.images?.[0]?.url ? "Change Image" : "Upload Image to Cloudinary"}
                      </button>
                    )}
                  </CldUploadWidget>
                ) : (
                  <p className="rounded bg-red-50 p-2 text-xs text-red-700">Cloudinary is not configured. Check your .env file.</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={busy || !form.images?.length} className="flex-1 btn-primary px-4 py-2.5 rounded-lg font-black text-sm disabled:opacity-50">
                  {busy ? "Saving..." : editingId ? "Update Product" : "Create Product"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-lg border border-[var(--border-primary)] text-sm font-bold">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}