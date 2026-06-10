"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const CldUploadWidget = dynamic(() => import("next-cloudinary").then(mod => ({ default: mod.CldUploadWidget })), { ssr: false });

export default function AdminProductModal({
  isOpen,
  onClose,
  form,
  setForm,
  editingId,
  busy,
  uploadProgress,
  cloudinaryConfig,
  canUpload,
  handleUpload,
  handleUploadStart,
  removeImage,
  resetForm,
  saveProduct,
}) {
  const [activeTab, setActiveTab] = useState("details");

  if (!isOpen) return null;

  const categories = [
    "General", "Electronics", "Clothing", "Home & Kitchen", "Books",
    "Beauty", "Sports", "Toys", "Automotive", "Health", "Music", "Garden"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-0 md:pt-10 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-0 md:mx-4 my-0 md:my-8 rounded-none md:rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] backdrop-blur-xl shadow-2xl overflow-hidden animate-modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-green-bright)] flex items-center justify-center text-white text-sm">
              {editingId ? "✏️" : "➕"}
            </div>
            <div>
              <h2 className="font-black text-[var(--text-primary)]">
                {editingId ? "Edit Product" : "Create Product"}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {editingId ? "Update product details" : "Add a new product to the catalog"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)] hover:bg-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 border-b border-[var(--border-subtle)]">
          {["details", "media"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === tab
                  ? "border-[var(--brand-green)] text-[var(--text-accent)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
              type="button"
            >
              {tab === "details" ? "📋 Details" : "🖼️ Media"}
            </button>
          ))}
        </div>

        <form onSubmit={saveProduct} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === "details" && (
            <>
              {/* Title & Category row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Product Title</label>
                  <input
                    className="themed-input"
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Enter product title"
                    value={form.title}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Category</label>
                  <select
                    className="themed-select"
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    value={form.category}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">Description</label>
                <textarea
                  className="themed-input min-h-[80px] resize-y"
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your product..."
                  value={form.description}
                />
              </div>

              {/* Price & Stock row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Price (INR)</label>
                  <input
                    className="themed-input"
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    type="number"
                    value={form.price}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">Stock</label>
                  <input
                    className="themed-input"
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="0"
                    type="number"
                    value={form.stock}
                    min="0"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">Tags (comma separated)</label>
                <input
                  className="themed-input"
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. trending, new, featured"
                  value={form.tags}
                />
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-secondary)] cursor-pointer hover:bg-[var(--tab-hover-bg)] transition-all">
                <div className={`w-10 h-6 rounded-full transition-all duration-300 relative ${
                  form.active ? "bg-[var(--brand-green)]" : "bg-[var(--border-primary)]"
                }`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                    form.active ? "left-[18px]" : "left-0.5"
                  }`} />
                </div>
                <div>
                  <span className="text-sm font-bold text-[var(--text-primary)]">Active product</span>
                  <p className="text-xs text-[var(--text-muted)]">Visible and available for purchase</p>
                </div>
                <input
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  type="checkbox"
                  className="sr-only"
                />
              </label>
            </>
          )}

          {activeTab === "media" && (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-dashed border-[var(--border-primary)] p-8 text-center">
                {form.images?.[0]?.url ? (
                  <div className="relative inline-block">
                    <img
                      alt="Product preview"
                      className="h-48 w-48 rounded-xl object-contain bg-[var(--surface-secondary)]"
                      src={form.images[0].url}
                    />
                    <button
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600 shadow-lg transition-all"
                      onClick={(e) => { e.preventDefault(); removeImage(); }}
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="text-4xl">🖼️</span>
                    <p className="text-sm font-bold text-[var(--text-muted)]">Upload product image</p>
                    <p className="text-xs text-[var(--text-muted)]">JPG, PNG, or WEBP. Max 5MB.</p>
                  </div>
                )}

                {canUpload && CldUploadWidget ? (
                  <div className="mt-4">
                    <CldUploadWidget
                      config={{ cloud: { cloudName: cloudinaryConfig.cloudName, apiKey: cloudinaryConfig.apiKey } }}
                      onSuccess={handleUpload}
                      onQueued={handleUploadStart}
                      options={{
                        folder: "dr-mart/products",
                        maxFiles: 1,
                        multiple: false,
                        resourceType: "image",
                        clientAllowedFormats: ["jpg", "png", "webp"],
                        sources: ["local", "camera"],
                        maxFileSize: 5000000,
                      }}
                      signatureEndpoint="/api/cloudinary/sign"
                    >
                      {({ open }) => (
                        <button
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white text-sm font-bold hover:shadow-lg hover:shadow-[var(--brand-green)]/25 transition-all"
                          onClick={() => open()}
                          type="button"
                        >
                          {form.images?.[0]?.url ? "Change Image" : "Upload Image"}
                        </button>
                      )}
                    </CldUploadWidget>
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                    Cloudinary is not configured. Check your .env file.
                  </p>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-[var(--text-muted)]">Uploading...</span>
                      <span className="text-[var(--brand-green)]">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => { resetForm(); onClose(); }}
              className="px-5 py-2.5 rounded-xl border border-[var(--border-primary)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !form.images?.length || !form.title}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-bright)] text-white text-sm font-bold disabled:opacity-40 hover:shadow-lg hover:shadow-[var(--brand-green)]/25 transition-all flex items-center gap-2"
            >
              {busy ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving...
                </>
              ) : (
                <>{editingId ? "✏️ Update Product" : "➕ Create Product"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}