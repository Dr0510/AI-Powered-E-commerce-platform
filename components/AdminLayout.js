"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--shell-bg)] admin-page">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[260px]"}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 md:px-8 h-16">
            <div className="flex items-center gap-3 pl-10 md:pl-0">
              <div>
                <h1 className="text-base font-black text-[var(--text-primary)]">Admin Dashboard</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
          {mounted ? children : (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 text-[var(--text-muted)]">
                <span className="w-4 h-4 rounded-full border-2 border-[var(--border-primary)] border-t-[var(--brand-green)] animate-spin" />
                <span className="text-sm font-bold">Loading...</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}