"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast, ToastContainer } from "@/components/Toast";

export default function SellerMessages() {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();
  const chatEnd = useRef(null);

  async function loadConversations() {
    try {
      const data = await api("/api/sellers/chat");
      setConversations(data.conversations || []);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(customerId) {
    setSelectedCustomer(customerId);
    try {
      const data = await api(`/api/sellers/chat?customerId=${customerId}`);
      setMessages(data.messages || []);
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage(event) {
    event.preventDefault();
    if (!newMessage.trim() || !selectedCustomer) return;
    setSending(true);
    try {
      await api("/api/sellers/chat", { method: "POST", body: JSON.stringify({ customerId: selectedCustomer, message: newMessage.trim() }) });
      setNewMessage("");
      await loadMessages(selectedCustomer);
      await loadConversations();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--brand-green)] border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--brand-green)] text-white px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/seller/dashboard" className="text-xs font-bold opacity-80 hover:opacity-100">← Dashboard</Link>
          <h1 className="text-xl font-black mt-1">Customer Messages</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[320px_1fr] gap-6" style={{ minHeight: "60vh" }}>
          {/* Conversations List */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border-primary)]">
              <h2 className="font-black text-sm">Conversations</h2>
            </div>
            <div className="divide-y divide-[var(--border-primary)]">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-[var(--text-muted)]">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.customer_id}
                    onClick={() => loadMessages(conv.customer_id)}
                    className={`w-full p-4 text-left hover:bg-[var(--surface-secondary)] transition-colors ${selectedCustomer === conv.customer_id ? "bg-[var(--surface-secondary)]" : ""}`}
                  >
                    <p className="font-bold text-sm truncate">{conv.customer_name || "Customer"}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{conv.last_message}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{new Date(conv.last_message_at).toLocaleDateString()}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="glass-panel rounded-xl flex flex-col">
            {selectedCustomer ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "50vh" }}>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_type === "seller" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.sender_type === "seller"
                          ? "bg-[var(--brand-green)] text-white rounded-br-md"
                          : "bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-bl-md"
                      }`}>
                        <p>{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.sender_type === "seller" ? "text-white/60" : "text-[var(--text-muted)]"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEnd} />
                </div>

                <form onSubmit={sendMessage} className="border-t border-[var(--border-primary)] p-4 flex gap-3">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 rounded-lg border border-[var(--border-primary)] bg-[var(--input-bg)] px-4 py-3 text-sm"
                  />
                  <button type="submit" disabled={sending || !newMessage.trim()} className="btn-primary px-6 py-3 rounded-lg font-black text-sm disabled:opacity-50">
                    {sending ? "..." : "Send"}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[40vh]">
                <div className="text-center">
                  <div className="text-5xl mb-4">💬</div>
                  <p className="font-bold text-[var(--text-muted)]">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}