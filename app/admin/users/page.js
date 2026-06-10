"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import AdminLayout from "@/components/AdminLayout";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);
  const limit = 25;

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const data = await api(`/api/admin/users?${params}`);
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (e) { showToast(e.message, "error"); } finally { setLoading(false); }
  }, [currentPage, search, roleFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-black text-[var(--text-primary)]">Users</h2><p className="text-xs text-[var(--text-muted)]">{total} total users</p></div><button onClick={loadUsers} className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-all" type="button">🔄 Refresh</button></div>

        <div className="flex flex-wrap items-center gap-3">
          <input className="themed-input !py-2 !text-sm max-w-xs" placeholder="🔍 Search users..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          <select className="themed-select !py-2 !text-sm" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">All Roles</option><option value="admin">Admin</option><option value="customer">Customer</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5"><div className="skeleton w-1/3 h-5 mb-3" /><div className="skeleton w-1/2 h-4 mb-2" /><div className="skeleton w-1/4 h-4" /></div>)}</div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] py-16 text-center"><span className="text-4xl mb-4 block">👥</span><h3 className="font-black text-[var(--text-primary)]">No users found</h3><p className="text-sm text-[var(--text-muted)] mt-1">Users will appear here once they sign up.</p></div>
        ) : (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] overflow-hidden">
            <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <span>Name</span><span>Email</span><span>Role</span><span>Orders</span><span>Spent</span><span>Joined</span>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {users.map(u => (
                <div key={u._id} className="p-4 md:px-5 md:py-3 hover:bg-[var(--tab-hover-bg)] transition-all cursor-pointer" onClick={() => setExpandedId(expandedId === u._id ? null : u._id)}>
                  <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_auto_auto_auto_auto] gap-2 md:gap-4 items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--brand-green)]/20 to-[var(--brand-green-bright)]/20 flex items-center justify-center text-sm font-bold text-[var(--text-accent)]">{(u.name || "U").charAt(0).toUpperCase()}</div>
                      <p className="font-bold text-sm text-[var(--text-primary)] truncate">{u.name || "—"}</p>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] truncate">{u.email || "—"}</p>
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ${u.role === "admin" ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600"}`}>{u.role}</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{u.orderCount || 0}</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{money((u.totalSpentInPaise || 0) / 100)}</span>
                    <span className="text-xs text-[var(--text-muted)]" suppressHydrationWarning>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</span>
                  </div>
                  {expandedId === u._id && (
                    <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Clerk ID</p><p className="text-xs text-[var(--text-secondary)] font-mono truncate">{u.clerkId || "—"}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Reviews</p><p className="text-sm font-bold text-[var(--text-primary)]">{u.reviewCount || 0}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Wishlist</p><p className="text-sm font-bold text-[var(--text-primary)]">{u.wishlistCount || 0}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Total Spent</p><p className="text-sm font-bold text-[var(--text-primary)]">{money((u.totalSpentInPaise || 0) / 100)}</p></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {totalPages > 1 && <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-subtle)]"><p className="text-xs text-[var(--text-muted)]">Page {currentPage} of {totalPages}</p><div className="flex gap-1.5"><button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-bold disabled:opacity-30" type="button">←</button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-bold disabled:opacity-30" type="button">→</button></div></div>}
          </div>
        )}
      </div>
      {toast && <div className="fixed top-4 right-4 z-[9999] px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-lg text-sm font-bold animate-modal-enter">{toast.type==="error"?"❌":"✅"} {toast.msg}</div>}
    </AdminLayout>
  );
}