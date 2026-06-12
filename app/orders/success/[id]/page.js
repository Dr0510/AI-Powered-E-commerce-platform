"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { moneyFromPaise } from "@/lib/format";
import { StoreHeader, StatusPill } from "@/components/StoreShell";

export default function OrderSuccessPage() {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders`);
        if (res.ok) {
          const data = await res.json();
          const found = (data.orders || []).find((o) => o.id === params.id || o._id === params.id);
          if (found) setOrder(found);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    fetchOrder();
  }, [params.id]);

  if (loading) {
    return (
      <main className="luxury-shell min-h-screen text-[var(--text-primary)]">
        <StoreHeader />
        <section className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="animate-pulse space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-[var(--skeleton-base)]" />
            <div className="mx-auto h-6 w-64 rounded bg-[var(--skeleton-base)]" />
            <div className="mx-auto h-4 w-48 rounded bg-[var(--skeleton-base)]" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="luxury-shell min-h-screen text-[var(--text-primary)]">
      <StoreHeader />

      <section className="mx-auto max-w-2xl px-4 py-12">
        <div className="glass-panel rounded p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-green)]/10">
            <svg className="h-10 w-10 text-[var(--brand-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <h1 className="mt-6 text-3xl font-black text-[var(--brand-green)]">Order Placed Successfully!</h1>
          <p className="mt-2 text-[var(--text-muted)]">
            Thank you for your purchase. Your order has been confirmed.
          </p>

          {order && (
            <div className="mt-8 text-left">
              {/* Order Number */}
              <div className="rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">Order Number</p>
                    <p className="mt-1 text-lg font-black font-mono">#{order.id?.toString().slice(-8).toUpperCase() || "N/A"}</p>
                  </div>
                  <StatusPill tone="green">{order.status === "paid" ? "Paid" : order.status === "pending" ? "Pending" : "Confirmed"}</StatusPill>
                </div>
              </div>

              {/* Order Items */}
              <div className="mt-4 rounded border border-[var(--border-primary)] p-4">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-3">Items Ordered</p>
                <div className="space-y-3">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {item.image && (
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-[var(--surface-secondary)] p-1 flex items-center justify-center">
                          <img alt={item.title} className="h-full w-full object-contain" src={item.image} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold line-clamp-1">{item.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold">{moneyFromPaise(item.priceInPaise * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress?.line1 && (
                <div className="mt-4 rounded border border-[var(--border-primary)] p-4">
                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">Delivery Address</p>
                  <p className="mt-1 font-bold text-sm">{order.shippingAddress.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {order.shippingAddress.line1}, {order.shippingAddress.city}
                    {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} — {order.shippingAddress.pincode}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">Phone: {order.shippingAddress.phone}</p>
                </div>
              )}

              {/* Order Summary */}
              <div className="mt-4 rounded border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-2">Order Summary</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Subtotal</span>
                    <strong>{moneyFromPaise(order.totalInPaise + (order.discountInPaise || 0) - (order.shippingChargeInPaise || 0) - (order.taxInPaise || 0))}</strong>
                  </div>
                  {order.discountInPaise > 0 && (
                    <div className="flex justify-between text-[var(--brand-green)]">
                      <span>Discount</span>
                      <strong>-{moneyFromPaise(order.discountInPaise)}</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Shipping</span>
                    <strong className={!order.shippingChargeInPaise ? "text-[var(--brand-green)]" : ""}>
                      {!order.shippingChargeInPaise ? "FREE" : moneyFromPaise(order.shippingChargeInPaise)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Tax (GST)</span>
                    <strong>{moneyFromPaise(order.taxInPaise || 0)}</strong>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border-primary)] pt-2 text-base font-black">
                    <span>Total</span>
                    <span>{moneyFromPaise(order.totalInPaise)}</span>
                  </div>
                  {order.couponCode && (
                    <p className="pt-1 text-xs text-[var(--brand-green)]">Coupon applied: {order.couponCode}</p>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="mt-4 rounded border border-[var(--border-primary)] p-4">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">Payment</p>
                <p className="mt-1 text-sm font-bold">
                  {order.paymentMethod === "cod" ? "💵 Cash on Delivery" : "💳 Card / UPI"}
                </p>
                {order.payment?.status && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Status: <span className="font-bold text-[var(--brand-green)] capitalize">{order.payment.status}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Delivery estimate */}
          <div className="mt-6 rounded bg-[var(--brand-green)]/5 p-4 text-sm">
            <p className="font-bold">🚚 Estimated Delivery</p>
            <p className="text-[var(--text-muted)] mt-0.5">
              Your order will be delivered in 3-5 business days.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/orders"
              className="rounded border border-[var(--border-primary)] px-6 py-3 text-sm font-bold hover:bg-[var(--surface-secondary)] w-full sm:w-auto text-center"
            >
              View All Orders
            </Link>
            <Link
              href="/"
              className="rounded bg-[var(--brand-green)] px-6 py-3 text-sm font-bold text-white hover:shadow-lg w-full sm:w-auto text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}