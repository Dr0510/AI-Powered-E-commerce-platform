"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast, ToastContainer } from "@/components/Toast";

export default function SellerPayouts() {
  const [data, setData] = useState({ payouts: [], totalEarnings: 0, availableBalance: 0, paidSoFar: 0 });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: "", bankAccount: "", upi: "" });
  const [busy, setBusy] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();

  async function loadPayouts() {
    try {
      const res = await api("/api/sellers/payouts");
      setData(res);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPayouts(); }, []);

  async function requestPayout(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/sellers/payouts", { method: "POST", body: JSON.stringify(form) });
      showToast("Payout requested!", "success");
      setForm({ amount: "", bankAccount: "", upi: "" });
      await loadPayouts();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--brand-green)] border-t-transparent" /></div>;

  const available = data.availableBalance / 100;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--brand-green)] text-white px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/seller/dashboard" className="text-xs font-bold opacity-80 hover:opacity-100">← Dashboard</Link>
          <h1 className="text-xl font-black mt-1">Payout Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-panel rounded-xl p-6">
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Total Earnings</p>
            <p className="text-3xl font-black mt-1 text-[var(--brand-green)]">₹{Number(data.totalEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="glass-panel rounded-xl p-6">
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Available Balance</p>
            <p className="text-3xl font-black mt-1 text-[var(--brand-green)]">₹{available.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="glass-panel rounded-xl p-6">
            <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Paid So Far</p>
            <p className="text-3xl font-black mt-1">₹{(data.paidSoFar / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Payout History */}
          <div className="space-y-3">
            <h2 className="text-lg font-black">Payout History ({data.payouts.length})</h2>
            {data.payouts.length === 0 ? (
              <div className="glass-panel rounded-xl p-8 text-center">
                <div className="text-5xl mb-4">💰</div>
                <p className="font-bold text-[var(--text-muted)]">No payouts yet.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {data.payouts.map((payout) => (
                  <div key={payout.id} className="glass-panel rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-black">₹{(payout.amount_in_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-[var(--text-muted)]">{new Date(payout.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      payout.status === "completed" ? "bg-green-100 text-green-700" :
                      payout.status === "processing" ? "bg-blue-100 text-blue-700" :
                      payout.status === "failed" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {payout.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Request Payout */}
          <div className="glass-panel rounded-xl p-5 h-fit sticky top-6">
            <h2 className="font-black mb-4">Request Payout</h2>
            <form onSubmit={requestPayout} className="space-y-3">
              <input className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} type="number" step="0.01" max={available} placeholder={`Amount (₹) - Max ₹${available.toFixed(2)}`} required />
              <input className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.bankAccount} onChange={e => setForm({...form, bankAccount: e.target.value})} placeholder="Bank Account (Account No + IFSC)" />
              <p className="text-xs text-center text-[var(--text-muted)]">OR</p>
              <input className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" value={form.upi} onChange={e => setForm({...form, upi: e.target.value})} placeholder="UPI ID (e.g. name@upi)" />
              <button type="submit" disabled={busy || !form.amount || (!form.bankAccount && !form.upi)} className="w-full btn-primary px-4 py-2.5 rounded-lg font-black text-sm disabled:opacity-50">
                {busy ? "Processing..." : "Request Payout"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}