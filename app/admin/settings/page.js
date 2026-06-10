"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";

export default function AdminSettingsPage() {
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const [settings, setSettings] = useState({
    siteName: "DR MART",
    siteDescription: "Premium Commerce from DR Group",
    defaultCurrency: "INR",
    defaultCommissionRate: 10,
    maxProductsPerSeller: 100,
    minPayoutAmount: 1000,
    autoApproveSellers: false,
    enableAIHub: true,
    enableAnalytics: true,
    maintenanceMode: false,
  });

  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
    showToast("Setting updated (local only — add persistence to save)");
  }

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">Settings</h2>
          <p className="text-xs text-[var(--text-muted)]">Configure your admin panel and store settings</p>
        </div>

        {/* Site Settings */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6">
          <h3 className="text-sm font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">🌐 Site Settings</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Store Name</label>
              <input className="themed-input !py-2 !text-sm" value={settings.siteName} onChange={e => updateSetting("siteName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Site Description</label>
              <input className="themed-input !py-2 !text-sm" value={settings.siteDescription} onChange={e => updateSetting("siteDescription", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Default Currency</label>
              <select className="themed-select !py-2 !text-sm" value={settings.defaultCurrency} onChange={e => updateSetting("defaultCurrency", e.target.value)}>
                <option value="INR">INR (Indian Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Maintenance Mode</label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-secondary)] cursor-pointer" onClick={() => updateSetting("maintenanceMode", !settings.maintenanceMode)}>
                <div className={`w-10 h-6 rounded-full transition-all relative ${settings.maintenanceMode ? "bg-red-500" : "bg-[var(--border-primary)]"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings.maintenanceMode ? "left-[18px]" : "left-0.5"}`} />
                </div>
                <div><span className="text-sm font-bold text-[var(--text-primary)]">Maintenance Mode</span><p className="text-[10px] text-[var(--text-muted)]">Disable public access to the store</p></div>
              </label>
            </div>
          </div>
        </div>

        {/* Seller Settings */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6">
          <h3 className="text-sm font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">🏪 Seller Settings</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Default Commission Rate (%)</label>
              <input className="themed-input !py-2 !text-sm" type="number" min="0" max="100" step="0.5" value={settings.defaultCommissionRate} onChange={e => updateSetting("defaultCommissionRate", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Max Products per Seller</label>
              <input className="themed-input !py-2 !text-sm" type="number" min="1" value={settings.maxProductsPerSeller} onChange={e => updateSetting("maxProductsPerSeller", parseInt(e.target.value) || 100)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Minimum Payout Amount (₹)</label>
              <input className="themed-input !py-2 !text-sm" type="number" min="0" value={settings.minPayoutAmount} onChange={e => updateSetting("minPayoutAmount", parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Auto-Approve Sellers</label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-secondary)] cursor-pointer" onClick={() => updateSetting("autoApproveSellers", !settings.autoApproveSellers)}>
                <div className={`w-10 h-6 rounded-full transition-all relative ${settings.autoApproveSellers ? "bg-emerald-500" : "bg-[var(--border-primary)]"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings.autoApproveSellers ? "left-[18px]" : "left-0.5"}`} />
                </div>
                <span className="text-sm font-bold text-[var(--text-primary)]">Auto-Approve New Sellers</span>
              </label>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6">
          <h3 className="text-sm font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">⚡ Feature Flags</h3>
          <div className="space-y-3">
            {[{ key: "enableAIHub", label: "AI Hub", desc: "Enable AI-powered product comparison tool" }, { key: "enableAnalytics", label: "Analytics Dashboard", desc: "Enable analytics charts and reporting" }].map(f => (
              <label key={f.key} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-secondary)] cursor-pointer" onClick={() => updateSetting(f.key, !settings[f.key])}>
                <div className={`w-10 h-6 rounded-full transition-all relative ${settings[f.key] ? "bg-[var(--brand-green)]" : "bg-[var(--border-primary)]"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings[f.key] ? "left-[18px]" : "left-0.5"}`} />
                </div>
                <div><span className="text-sm font-bold text-[var(--text-primary)]">{f.label}</span><p className="text-[10px] text-[var(--text-muted)]">{f.desc}</p></div>
              </label>
            ))}
          </div>
        </div>

        {/* System Info */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6">
          <h3 className="text-sm font-black text-[var(--text-primary)] mb-4 flex items-center gap-2">💻 System Information</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {[{ k: "Platform", v: "Next.js 16 + React" }, { k: "Database", v: "Neon PostgreSQL" }, { k: "Auth", v: "Clerk" }, { k: "Payments", v: "Razorpay" }, { k: "Storage", v: "Cloudinary" }, { k: "Theme", v: "Light/Dark Mode" }].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-secondary)]"><span className="text-xs font-bold text-[var(--text-muted)]">{item.k}</span><span className="text-xs font-bold text-[var(--text-primary)]">{item.v}</span></div>
            ))}
          </div>
        </div>
      </div>
      {toast && <div className="fixed top-4 right-4 z-[9999] px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-lg text-sm font-bold animate-modal-enter">{toast.type==="error"?"❌":"✅"} {toast.msg}</div>}
    </AdminLayout>
  );
}