"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast, ToastContainer } from "@/components/Toast";

export default function SellerCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: "", discountType: "percent", discountValue: "", minPurchase: "", maxUses: "", expiryDate: "" });
  const [busy, setBusy] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();

  async function loadCoupons() {
    try {
      const data = await api("/api/sellers/coupons");
      setCoupons(data.coupons);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCoupons(); }, []);

  async function createCoupon(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/sellers/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discountValue: form.discountValue,
          minPurchaseInPaise: Math.round(Number(form.minPurchase || 0) * 100),
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiryDate: form.expiryDate || null,
        }),
      });
      showToast("Coupon created!", "success");
      setForm({ code: "", discountType: "percent", discountValue: "", minPurchase: "", maxUses: "", expiryDate: "" });
      await loadCoupons();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleCoupon(couponId, active) {
    try {
      await api("/api/sellers/coupons", { method: "PATCH", body: JSON.stringify({ couponId, active: !active }) });
      await loadCoupons();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--brand-green)] border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--brand-green)] text-white px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/seller/dashboard" className="text-xs font-bold opacity-80 hover:opacity-100">← Dashboard</Link>
          <h1 className="text-xl font-black mt-1">Coupon Management</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Coupons List */}
        <div className="space-y-3">
          <h2 className="text-lg font-black">Your Coupons ({coupons.length})</h2>
          {coupons.length === 0 ? (
            <div className="glass-panel rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">🎟️</div>
              <p className="font-bold text-[var(--text-muted)]">No coupons yet. Create your first discount!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="glass-panel rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black font-mono text-lg">{coupon.code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${coupon.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {coupon.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      {coupon.discount_type === "percent" ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                      {coupon.min_purchase_in_paise > 0 && ` · Min ₹${(coupon.min_purchase_in_paise / 100).toFixed(0)}`}
                      {coupon.max_uses && ` · Max ${coupon.max_uses} uses`}
                      {coupon.expiry_date && ` · Exp ${new Date(coupon.expiry_date).toLocaleDateString()}`}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Used: {coupon.used_count || 0}{coupon.max_uses ? `/${coupon.max_uses}` : ""}</p>
                  </div>
                  <button onClick={() => toggleCoupon(coupon.id, coupon.active)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${coupon.active ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
                    {coupon.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Form */}
        <div className="glass-panel rounded-xl p-5 h-fit sticky top-6">
          <h2 className="font-black mb-4">Create Coupon</h2>
          <form onSubmit={createCoupon} className="space-y-3">
            <input className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm font-mono uppercase" value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="COUPON_CODE *" required />
            <select className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})}>
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
            <input className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} type="number" step="0.01" placeholder={form.discountType === "percent" ? "Discount % *" : "Discount Amount (₹) *"} required />
            <input className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.minPurchase} onChange={e => setForm({...form, minPurchase: e.target.value})} type="number" placeholder="Min Purchase (₹)" />
            <input className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} type="number" placeholder="Max Uses (leave empty for unlimited)" />
            <input className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} type="date" />
            <button type="submit" disabled={busy} className="w-full btn-primary px-4 py-2.5 rounded-lg font-black text-sm disabled:opacity-50">
              {busy ? "Creating..." : "Create Coupon"}
            </button>
          </form>
        </div>
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}