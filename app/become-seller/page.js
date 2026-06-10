"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast, ToastContainer } from "@/components/Toast";

export default function BecomeSeller() {
  const router = useRouter();
  const { toasts, showToast, dismissToast } = useToast();
  const [form, setForm] = useState({ shopName: "", description: "", category: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs = {};
    if (!form.shopName || form.shopName.trim().length < 2) {
      errs.shopName = "Shop name must be at least 2 characters";
    }
    if (!form.category) {
      errs.category = "Please select a category";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await api("/api/sellers", { method: "POST", body: JSON.stringify(form) });
      showToast("Store created successfully! Welcome to DR MART.", "success");
      setTimeout(() => router.push("/seller/dashboard"), 1000);
    } catch (error) {
      showToast(error.message || "Failed to create store", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--brand-green)] text-white px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="text-xs font-bold opacity-80 hover:opacity-100">← Back to Storefront</Link>
          <h1 className="text-2xl font-black mt-1">Become a Seller</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="glass-panel rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-black text-[var(--text-primary)]">Open Your Store</h2>
            <p className="text-[var(--text-muted)] mt-2">Start selling your products to thousands of customers on DR MART.</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1.5">Shop Name *</label>
              <input
                type="text"
                placeholder="My Awesome Store"
                value={form.shopName}
                onChange={(e) => { setForm({ ...form, shopName: e.target.value }); setErrors({}); }}
                className={`w-full rounded-xl border ${errors.shopName ? "border-red-400" : "border-[var(--border-primary)]"} bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)] transition-all`}
                required
              />
              {errors.shopName && <p className="text-xs text-red-500 mt-1 font-bold">{errors.shopName}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1.5">Shop Description</label>
              <textarea
                placeholder="Tell customers what you sell..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text-primary)] h-28 focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={(e) => { setForm({ ...form, category: e.target.value }); setErrors({}); }}
                className={`w-full rounded-xl border ${errors.category ? "border-red-400" : "border-[var(--border-primary)]"} bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)] transition-all`}
                required
              >
                <option value="">Select a category</option>
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
                <option value="Home">Home & Kitchen</option>
                <option value="Beauty">Beauty & Personal</option>
                <option value="Sports">Sports & Outdoors</option>
                <option value="Books">Books & Media</option>
                <option value="Toys">Toys & Games</option>
                <option value="Food">Food & Grocery</option>
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1 font-bold">{errors.category}</p>}
            </div>

            <div className="rounded-xl bg-[var(--surface-secondary)] p-4 text-sm text-[var(--text-secondary)]">
              <p className="font-bold mb-2">📋 What happens next?</p>
              <ul className="space-y-1.5">
                <li>✓ Your store will be created immediately</li>
                <li>✓ An admin will review and verify your store</li>
                <li>✓ Once verified, your products will be visible to customers</li>
                <li>✓ Start adding products right away!</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--brand-green)] text-white font-black py-3.5 text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating Store...
                </span>
              ) : (
                "Create Your Store"
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Already a seller?{" "}
            <Link href="/seller/dashboard" className="font-bold text-[var(--brand-green)] hover:underline">
              Go to Dashboard
            </Link>
          </p>
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}