"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast, ToastContainer } from "@/components/Toast";

export default function SellerSettings() {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ shopName: "", description: "", phone: "", address: "", city: "", state: "", pincode: "", logoUrl: "", bannerUrl: "" });
  const [vacationMode, setVacationMode] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const { toasts, showToast, dismissToast } = useToast();

  async function load() {
    try {
      const data = await api("/api/sellers/me");
      setSeller(data.seller);
      setForm({
        shopName: data.seller.shop_name || "",
        description: data.seller.description || "",
        phone: data.seller.phone || "",
        address: data.seller.address || "",
        city: data.seller.city || "",
        state: data.seller.state || "",
        pincode: data.seller.pincode || "",
        logoUrl: data.seller.logo_url || "",
        bannerUrl: data.seller.banner_url || "",
      });
      setVacationMode(data.seller.vacation_mode || false);
      // Load announcement
      try {
        const ann = await api("/api/sellers/announcements");
        setAnnouncement(ann.announcement || "");
      } catch (e) {}
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveSettings(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/sellers", {
        method: "PATCH",
        body: JSON.stringify({
          sellerId: seller.id,
          shop_name: form.shopName,
          description: form.description,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          logo_url: form.logoUrl,
          banner_url: form.bannerUrl,
        }),
      });
      showToast("Settings saved!", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleVacation() {
    setBusy(true);
    try {
      await api("/api/sellers", {
        method: "PATCH",
        body: JSON.stringify({ sellerId: seller.id, vacation_mode: !vacationMode }),
      });
      setVacationMode(!vacationMode);
      showToast(vacationMode ? "Vacation mode off" : "Vacation mode on", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function saveAnnouncement() {
    try {
      await api("/api/sellers/announcements", { method: "POST", body: JSON.stringify({ message: announcement }) });
      showToast("Announcement updated!", "success");
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
          <h1 className="text-xl font-black mt-1">Store Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Vacation Mode */}
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black">Vacation Mode</h2>
              <p className="text-sm text-[var(--text-muted)]">When enabled, your products will be hidden from customers</p>
            </div>
            <button onClick={toggleVacation} disabled={busy} className={`relative w-14 h-7 rounded-full transition-colors ${vacationMode ? "bg-yellow-500" : "bg-gray-300"} ${busy ? "opacity-50" : ""}`}>
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${vacationMode ? "translate-x-7" : ""}`} />
            </button>
          </div>
        </div>

        {/* Store Details */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="font-black mb-4">Store Details</h2>
          <form onSubmit={saveSettings} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.shopName} onChange={e => setForm({...form, shopName: e.target.value})} placeholder="Shop Name" />
              <input className="rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" />
            </div>
            <textarea className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm min-h-20" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Store Description" />
            <input className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Address" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City" />
              <input className="rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="State" />
              <input className="rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} placeholder="Pincode" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.logoUrl} onChange={e => setForm({...form, logoUrl: e.target.value})} placeholder="Logo URL" />
              <input className="rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.bannerUrl} onChange={e => setForm({...form, bannerUrl: e.target.value})} placeholder="Banner URL" />
            </div>
            <button type="submit" disabled={busy} className="btn-primary px-6 py-2.5 rounded-lg font-black text-sm disabled:opacity-50">
              {busy ? "Saving..." : "Save Settings"}
            </button>
          </form>
        </div>

        {/* Announcement Banner */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="font-black mb-2">Announcement Banner</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">Shown at the top of your store page</p>
          <div className="flex gap-3">
            <input className="flex-1 rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={announcement} onChange={e => setAnnouncement(e.target.value)} placeholder="e.g. Free shipping on orders over ₹999!" />
            <button onClick={saveAnnouncement} className="btn-primary px-4 py-2.5 rounded-lg font-black text-sm">Save</button>
          </div>
          {announcement && (
            <div className="mt-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm font-bold text-yellow-700 dark:text-yellow-400">
              📢 {announcement}
            </div>
          )}
        </div>

        {/* Subscription Info */}
        {seller && (
          <div className="glass-panel rounded-xl p-5">
            <h2 className="font-black mb-2">Subscription Plan</h2>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black capitalize text-[var(--brand-green)]">{seller.subscription_plan}</span>
              <span className="text-sm text-[var(--text-muted)]">
                {seller.subscription_plan === "basic" ? "10 products max · Basic analytics" : "Unlimited products · Advanced analytics · Priority support"}
              </span>
            </div>
            {seller.subscription_plan === "basic" && (
              <button onClick={() => showToast("Contact admin to upgrade to Pro", "info")} className="mt-3 btn-gold px-4 py-2 rounded-lg font-black text-sm">
                Upgrade to Pro
              </button>
            )}
          </div>
        )}

        {/* Store Preview */}
        {seller?.shop_slug && (
          <div className="glass-panel rounded-xl p-5">
            <h2 className="font-black mb-2">Store Page</h2>
            <a href={`/store/${seller.shop_slug}`} target="_blank" className="text-[var(--brand-green)] font-bold hover:underline">
              /store/{seller.shop_slug} ↗
            </a>
          </div>
        )}
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}