"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast, ToastContainer } from "@/components/Toast";

function Skeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--brand-green)] text-white px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="h-3 w-20 skeleton rounded" />
          <div className="h-6 w-40 skeleton rounded mt-2" />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-panel rounded-xl p-5">
            <div className="h-5 w-32 skeleton rounded mb-4" />
            <div className="space-y-3">
              <div className="h-10 w-full skeleton rounded" />
              <div className="h-10 w-full skeleton rounded" />
              <div className="h-20 w-full skeleton rounded" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

export default function SellerSettings() {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [vacationBusy, setVacationBusy] = useState(false);
  const [announceBusy, setAnnounceBusy] = useState(false);
  const [form, setForm] = useState({ shopName: "", description: "", phone: "", address: "", city: "", state: "", pincode: "", logoUrl: "", bannerUrl: "" });
  const [vacationMode, setVacationMode] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const { toasts, showToast, dismissToast } = useToast();

  async function load() {
    try {
      const data = await api("/api/sellers/me");
      if (!data.seller) {
        showToast("Seller account not found", "error");
        return;
      }
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
      setVacationMode(!!data.seller.vacation_mode);
      try {
        const ann = await api("/api/sellers/announcements");
        setAnnouncement(ann.announcement || "");
      } catch (e) {}
    } catch (error) {
      showToast(error.message || "Failed to load settings", "error");
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
      showToast("Settings saved successfully!", "success");
    } catch (error) {
      showToast(error.message || "Failed to save settings", "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleVacation() {
    setVacationBusy(true);
    const newValue = !vacationMode;
    try {
      await api("/api/sellers", {
        method: "PATCH",
        body: JSON.stringify({ sellerId: seller.id, vacation_mode: newValue }),
      });
      setVacationMode(newValue);
      showToast(newValue ? "Vacation mode enabled" : "Vacation mode disabled", "success");
    } catch (error) {
      showToast(error.message || "Failed to toggle vacation mode", "error");
    } finally {
      setVacationBusy(false);
    }
  }

  async function saveAnnouncement() {
    setAnnounceBusy(true);
    try {
      await api("/api/sellers/announcements", { method: "POST", body: JSON.stringify({ message: announcement }) });
      showToast("Announcement updated!", "success");
    } catch (error) {
      showToast(error.message || "Failed to save announcement", "error");
    } finally {
      setAnnounceBusy(false);
    }
  }

  if (loading) return <Skeleton />;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--brand-green)] text-white px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/seller/dashboard" className="text-xs font-bold opacity-80 hover:opacity-100 transition-opacity">← Dashboard</Link>
          <h1 className="text-xl font-black mt-1">Store Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Vacation Mode */}
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-black text-[var(--text-primary)]">Vacation Mode</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">When enabled, your products will be hidden from customers</p>
              <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${vacationMode ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${vacationMode ? "bg-yellow-500" : "bg-green-500"}`} />
                {vacationMode ? "Active" : "Inactive"}
              </span>
            </div>
            <button
              onClick={toggleVacation}
              disabled={vacationBusy}
              type="button"
              role="switch"
              aria-checked={vacationMode}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-green)] focus-visible:ring-offset-2 ${vacationMode ? "bg-yellow-500" : "bg-gray-300 dark:bg-gray-600"} ${vacationBusy ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${vacationMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>

        {/* Store Details */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="font-black text-[var(--text-primary)] mb-4">Store Details</h2>
          <form onSubmit={saveSettings} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">Shop Name</label>
                <input className="themed-input" value={form.shopName} onChange={e => setForm({...form, shopName: e.target.value})} placeholder="Your shop name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">Phone</label>
                <input className="themed-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Contact number" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">Description</label>
              <textarea className="themed-input min-h-24 resize-y" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Tell customers about your store" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">Address</label>
              <input className="themed-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Street address" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">City</label>
                <input className="themed-input" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">State</label>
                <input className="themed-input" value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="State" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">Pincode</label>
                <input className="themed-input" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} placeholder="Pincode" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">Logo URL</label>
                <input className="themed-input" value={form.logoUrl} onChange={e => setForm({...form, logoUrl: e.target.value})} placeholder="https://example.com/logo.png" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">Banner URL</label>
                <input className="themed-input" value={form.bannerUrl} onChange={e => setForm({...form, bannerUrl: e.target.value})} placeholder="https://example.com/banner.png" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={busy} className="btn-primary px-6 py-2.5 rounded-lg font-black text-sm disabled:opacity-50 transition-all">
                {busy ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </span>
                ) : "Save Settings"}
              </button>
              {busy && <span className="text-xs text-[var(--text-muted)]">Please wait...</span>}
            </div>
          </form>
        </div>

        {/* Announcement Banner */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="font-black text-[var(--text-primary)] mb-1">Announcement Banner</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">Shown at the top of your store page</p>
          <div className="flex gap-3">
            <input className="themed-input flex-1" value={announcement} onChange={e => setAnnouncement(e.target.value)} placeholder="e.g. Free shipping on orders over ₹999!" />
            <button onClick={saveAnnouncement} disabled={announceBusy} className="btn-primary px-5 py-2.5 rounded-lg font-black text-sm disabled:opacity-50 whitespace-nowrap">
              {announceBusy ? "Saving..." : "Save"}
            </button>
          </div>
          {announcement && (
            <div className="mt-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm font-bold text-yellow-700 dark:text-yellow-400 animate-fade-in">
              📢 {announcement}
            </div>
          )}
        </div>

        {/* Subscription Info */}
        {seller && (
          <div className="glass-panel rounded-xl p-5">
            <h2 className="font-black text-[var(--text-primary)] mb-1">Subscription Plan</h2>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-2xl font-black capitalize text-[var(--brand-green)]">{seller.subscription_plan}</span>
              <span className="text-sm text-[var(--text-muted)]">
                {seller.subscription_plan === "basic" ? "10 products max · Basic analytics" : "Unlimited products · Advanced analytics · Priority support"}
              </span>
            </div>
            {seller.subscription_plan === "basic" && (
              <button onClick={() => showToast("Contact admin to upgrade to Pro", "info")} className="mt-4 btn-gold px-4 py-2 rounded-lg font-black text-sm">
                Upgrade to Pro
              </button>
            )}
          </div>
        )}

        {/* Store Preview */}
        {seller?.shop_slug && (
          <div className="glass-panel rounded-xl p-5">
            <h2 className="font-black text-[var(--text-primary)] mb-1">Store Page</h2>
            <p className="text-sm text-[var(--text-muted)] mb-3">Your public storefront</p>
            <a href={`/store/${seller.shop_slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-[var(--brand-green)] font-bold hover:underline text-sm">
              /store/{seller.shop_slug} <span className="text-xs">↗</span>
            </a>
          </div>
        )}

      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}