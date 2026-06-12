"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-[var(--shell-bg)] admin-page">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[260px]"}`}>
        <div className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 md:px-8 h-16">
            <div className="flex items-center gap-3 pl-10 md:pl-0">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-green)] to-[var(--brand-green-bright)] text-sm font-black text-white shadow-lg shadow-[var(--brand-green)]/20">
                DM
              </div>
              <div>
                <h1 className="text-base font-black text-[var(--text-primary)]">Admin Dashboard</h1>
                <p className="hidden text-xs font-bold text-[var(--text-muted)] sm:block">Menu can collapse while the logo stays visible.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
