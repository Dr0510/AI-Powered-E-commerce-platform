"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast, ToastContainer } from "@/components/Toast";

export default function SellerBulkUpload() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(null);
  const fileRef = useRef(null);
  const { toasts, showToast, dismissToast } = useToast();

  async function handleUpload(event) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/sellers/bulk-upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setResults(data);
      showToast(`Uploaded ${data.success} products successfully!`, "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--brand-green)] text-white px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/seller/dashboard" className="text-xs font-bold opacity-80 hover:opacity-100">← Dashboard</Link>
          <h1 className="text-xl font-black mt-1">Bulk Product Upload</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Instructions */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="font-black mb-3">CSV Format Instructions</h2>
          <div className="bg-[var(--surface-secondary)] rounded-lg p-4 overflow-x-auto text-sm">
            <pre className="font-mono text-xs">
              title,price,description,category,stock,tags,image{'\n'}
              "Product Name",999.00,"Description here",Electronics,50,"tag1;tag2",https://example.com/image.jpg
            </pre>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-[var(--text-muted)]">
            <li>• CSV file must have a header row with column names</li>
            <li>• Required columns: <strong>title</strong>, <strong>price</strong></li>
            <li>• Optional columns: description, category, stock, tags, image</li>
            <li>• Tags should be separated by semicolons (;)</li>
            <li>• Basic plan limited to 10 products total</li>
          </ul>
        </div>

        {/* Upload */}
        <div className="glass-panel rounded-xl p-5">
          <form onSubmit={handleUpload} className="space-y-4">
            <div
              className="border-2 border-dashed border-[var(--border-secondary)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--brand-green)] hover:bg-[var(--surface-secondary)] transition-all"
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-5xl mb-4">📤</div>
              <p className="font-bold text-sm">{file ? file.name : "Click to select CSV file"}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Supports .csv files</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files[0])} required />
            </div>
            <button type="submit" disabled={busy || !file} className="w-full btn-primary px-6 py-3 rounded-lg font-black text-sm disabled:opacity-50">
              {busy ? "Uploading..." : "Upload & Import"}
            </button>
          </form>

          {busy && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-green)] border-t-transparent" />
              <span className="font-bold">Processing file...</span>
            </div>
          )}

          {results && (
            <div className="mt-4 space-y-2">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="font-bold text-green-700">✅ {results.success} products uploaded successfully</p>
              </div>
              {results.errors?.length > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="font-bold text-red-700 mb-2">❌ {results.errors.length} errors</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {results.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600">{err}</p>
                    ))}
                  </div>
                </div>
              )}
              <Link href="/seller/products" className="block text-center text-sm font-bold text-[var(--brand-green)] underline mt-2">
                View your products →
              </Link>
            </div>
          )}
        </div>
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}