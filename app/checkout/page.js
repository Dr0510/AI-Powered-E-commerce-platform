"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useCallback, useRef } from "react";
import { moneyFromPaise, priceInPaise, normalizePaise } from "@/lib/format";
import { StoreHeader, StatusPill } from "@/components/StoreShell";
import { useToast, ToastContainer } from "@/components/Toast";

const COUPON_DEBOUNCE = 400;
const SAVE_KEY = "checkout_draft";
const STEPS = ["cart", "address", "payment", "review"];

const INITIAL_ADDRESS = { name: "", phone: "", line1: "", city: "", state: "", country: "India", pincode: "", addressType: "home" };

// ─── Reducer ────────────────────────────────────────────
function checkoutReducer(state, action) {
  switch (action.type) {
    case "SET_CART":
      return { ...state, cart: action.payload };
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_ADDRESSES":
      return { ...state, addresses: action.payload, addressesLoading: false };
    case "SET_ADDRESSES_LOADING":
      return { ...state, addressesLoading: action.payload };
    case "SELECT_ADDRESS":
      return { ...state, selectedAddressId: action.payload, newAddress: { ...INITIAL_ADDRESS } };
    case "SET_NEW_ADDRESS":
      return { ...state, newAddress: { ...state.newAddress, ...action.payload } };
    case "SET_NEW_ADDRESS_FIELD":
      return {
        ...state,
        newAddress: { ...state.newAddress, [action.payload.field]: action.payload.value },
      };
    case "SET_ADDRESS_ERRORS":
      return { ...state, addressErrors: action.payload };
    case "SET_PAYMENT_METHOD":
      return { ...state, paymentMethod: action.payload };
    case "APPLY_COUPON":
      return {
        ...state,
        coupon: action.payload.coupon,
        couponCode: action.payload.code,
        couponLoading: false,
        couponError: null,
        couponDiscount: action.payload.discountAmount || 0,
      };
    case "SET_COUPON_CODE":
      return { ...state, couponCode: action.payload, couponError: null };
    case "SET_COUPON_LOADING":
      return { ...state, couponLoading: action.payload };
    case "SET_COUPON_ERROR":
      return { ...state, couponError: action.payload, couponLoading: false, coupon: null, couponDiscount: 0 };
    case "REMOVE_COUPON":
      return { ...state, coupon: null, couponCode: "", couponError: null, couponDiscount: 0 };
    case "SET_PINCODE_ERROR":
      return { ...state, pincodeError: action.payload, pincodeLoading: false };
    case "SET_PINCODE_LOADING":
      return { ...state, pincodeLoading: action.payload, pincodeError: null };
    case "SET_PINCODE_DATA":
      return {
        ...state,
        pincodeData: action.payload,
        pincodeLoading: false,
        pincodeError: null,
        newAddress: {
          ...state.newAddress,
          city: action.payload.city || state.newAddress.city,
          state: action.payload.state || state.newAddress.state,
        },
      };
    case "SET_PLACING_ORDER":
      return { ...state, placingOrder: action.payload, orderError: null };
    case "SET_ORDER_RESULT":
      return { ...state, orderResult: action.payload, placingOrder: false };
    case "SET_ORDER_ERROR":
      return { ...state, orderError: action.payload, placingOrder: false };
    case "RESTORE_DRAFT":
      return {
        ...state,
        ...action.payload,
        newAddress: { ...INITIAL_ADDRESS, ...(action.payload.newAddress || {}) },
      };
    default:
      return state;
  }
}

const initialState = {
  step: "cart",
  cart: [],
  user: null,
  addresses: [],
  addressesLoading: true,
  selectedAddressId: null,
  newAddress: { ...INITIAL_ADDRESS },
  addressErrors: {},
  paymentMethod: "razorpay",
  coupon: null,
  couponCode: "",
  couponLoading: false,
  couponError: null,
  couponDiscount: 0,
  pincodeData: null,
  pincodeLoading: false,
  pincodeError: null,
  placingOrder: false,
  orderResult: null,
  orderError: null,
};

export default function CheckoutPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(checkoutReducer, initialState);
  const { toasts, showToast, dismissToast } = useToast();
  const couponTimer = useRef(null);
  const pincodeTimer = useRef(null);
  const fired = useRef(false);

  // ── Load cart & user on mount ──────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("commerce_cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) dispatch({ type: "SET_CART", payload: parsed });
      } catch { /* ignore */ }
    }
    fetchUser();
    // Restore draft from saved checkout state
    try {
      const draft = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (draft) {
        dispatch({ type: "RESTORE_DRAFT", payload: draft });
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-save draft ─────────────────────────────────────
  useEffect(() => {
    const draft = {
      step: state.step,
      selectedAddressId: state.selectedAddressId,
      newAddress: state.newAddress,
      paymentMethod: state.paymentMethod,
      couponCode: state.couponCode,
      coupon: state.coupon,
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(draft)); }
    catch { /* ignore */ }
  }, [state.step, state.selectedAddressId, state.newAddress, state.paymentMethod, state.couponCode, state.coupon]);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SET_USER", payload: data.user || data });
      }
    } catch { /* ignore */ }
  }

  async function fetchAddresses() {
    dispatch({ type: "SET_ADDRESSES_LOADING", payload: true });
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) {
        const data = await res.json();
        const list = data.addresses || [];
        dispatch({ type: "SET_ADDRESSES", payload: list });
        const defaultAddr = list.find((a) => a.is_default);
        if (defaultAddr && !state.selectedAddressId) {
          dispatch({ type: "SELECT_ADDRESS", payload: defaultAddr.id });
        }
      } else {
        dispatch({ type: "SET_ADDRESSES", payload: [] });
      }
    } catch {
      dispatch({ type: "SET_ADDRESSES", payload: [] });
    }
  }

  // ── Totals (memoized) ──────────────────────────────────
  const totals = useMemo(() => {
    const subtotal = normalizePaise(
      state.cart.reduce((sum, item) => sum + priceInPaise(item) * item.quantity, 0)
    );
    let discountAmount = 0;
    let freeShipping = false;

    if (state.coupon) {
      if (state.coupon.discount_type === "percent") {
        discountAmount = Math.round((subtotal * Math.min(100, Number(state.coupon.discount_value))) / 100);
      } else if (state.coupon.discount_type === "fixed") {
        discountAmount = Math.min(Number(state.coupon.discount_value) * 100, subtotal);
      } else if (state.coupon.discount_type === "free_shipping") {
        freeShipping = true;
      }
    }

    const shipping = freeShipping || subtotal >= 49900 ? 0 : 4000;
    const taxable = Math.max(0, subtotal - discountAmount);
    const tax = Math.round(taxable * 0.12);
    const finalTotal = normalizePaise(subtotal - discountAmount + shipping + tax);

    return {
      subtotal, discountAmount, shipping, tax, finalTotal,
      subtotalF: moneyFromPaise(subtotal),
      discountF: moneyFromPaise(discountAmount),
      shippingF: moneyFromPaise(shipping),
      taxF: moneyFromPaise(tax),
      finalF: moneyFromPaise(finalTotal),
      freeShipping,
    };
  }, [state.cart, state.coupon]);

  const itemCount = useMemo(() => state.cart.reduce((s, i) => s + i.quantity, 0), [state.cart]);

  // ── Quantity update ───────────────────────────────────
  function updateQty(productId, quantity) {
    dispatch({
      type: "SET_CART",
      payload: state.cart
        .map((item) => (item.productId === productId ? { ...item, quantity: Math.max(0, quantity) } : item))
        .filter((item) => item.quantity > 0),
    });
  }

  // ── Step navigation ───────────────────────────────────
  function goToStep(step) {
    localStorage.setItem("commerce_cart", JSON.stringify(state.cart));
    if (step === "address") fetchAddresses();
    dispatch({ type: "SET_STEP", payload: step });
  }

  // ── Coupon handlers ───────────────────────────────────
  const applyCoupon = useCallback(async () => {
    const code = state.couponCode.trim();
    if (!code) return;
    dispatch({ type: "SET_COUPON_LOADING", payload: true });
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: totals.subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        dispatch({
          type: "APPLY_COUPON",
          payload: { coupon: data.coupon, code: code.toUpperCase(), discountAmount: data.discountAmount },
        });
        showToast(data.message || "Coupon applied!", "success");
      } else {
        dispatch({ type: "SET_COUPON_ERROR", payload: data.message || "Invalid coupon" });
      }
    } catch {
      dispatch({ type: "SET_COUPON_ERROR", payload: "Unable to validate coupon" });
    }
  }, [state.couponCode, totals.subtotal]); // eslint-disable-line react-hooks/exhaustive-deps

  function onCouponChange(value) {
    dispatch({ type: "SET_COUPON_CODE", payload: value.toUpperCase() });
    if (couponTimer.current) clearTimeout(couponTimer.current);
    if (state.coupon) {
      dispatch({ type: "REMOVE_COUPON" });
    }
  }

  function onCouponApply() {
    if (couponTimer.current) clearTimeout(couponTimer.current);
    applyCoupon();
  }

  // ── Pincode autofill ─────────────────────────────────
  function onPincodeChange(value) {
    const clean = value.replace(/\D/g, "").slice(0, 6);
    dispatch({ type: "SET_NEW_ADDRESS_FIELD", payload: { field: "pincode", value: clean } });
    if (pincodeTimer.current) clearTimeout(pincodeTimer.current);

    if (clean.length === 6) {
      dispatch({ type: "SET_PINCODE_LOADING", payload: true });
      pincodeTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/pincode?pincode=${clean}`);
          const data = await res.json();
          if (res.ok && data.status === "success") {
            dispatch({ type: "SET_PINCODE_DATA", payload: data.data });
          } else {
            dispatch({ type: "SET_PINCODE_ERROR", payload: data.message || "Pincode not found" });
          }
        } catch {
          dispatch({ type: "SET_PINCODE_ERROR", payload: "Unable to lookup pincode" });
        }
      }, 500);
    } else if (clean.length > 0) {
      dispatch({ type: "SET_PINCODE_ERROR", payload: null });
      dispatch({ type: "SET_PINCODE_LOADING", payload: false });
    }
  }

  // ── Address management ────────────────────────────────
  function validateAddressForm(addr) {
    const errors = {};
    if (!addr.name?.trim()) errors.name = "Full name is required";
    if (!addr.phone?.trim()) errors.phone = "Phone number is required";
    else if (!/^[0-9]{10}$/.test(addr.phone.replace(/\D/g, ""))) errors.phone = "Enter a valid 10-digit number";
    if (!addr.line1?.trim()) errors.line1 = "Address is required";
    if (!addr.city?.trim()) errors.city = "City is required";
    if (!addr.pincode?.trim()) errors.pincode = "Pincode is required";
    else if (!/^[0-9]{6}$/.test(addr.pincode.replace(/\D/g, ""))) errors.pincode = "Enter a valid 6-digit pincode";
    dispatch({ type: "SET_ADDRESS_ERRORS", payload: errors });
    return Object.keys(errors).length === 0;
  }

  function updateNewAddress(field, value) {
    dispatch({ type: "SET_NEW_ADDRESS_FIELD", payload: { field, value } });
    if (state.addressErrors[field]) {
      dispatch({ type: "SET_ADDRESS_ERRORS", payload: { ...state.addressErrors, [field]: undefined } });
    }
  }

  async function saveNewAddressToServer() {
    const addr = state.newAddress;
    if (!validateAddressForm(addr)) return null;

    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addr, isDefault: true }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchAddresses();
        showToast("Address saved!", "success");
        return data.address;
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to save address", "error");
        return null;
      }
    } catch {
      showToast("Unable to save address", "error");
      return null;
    }
  }

  async function deleteAddress(id) {
    try {
      const res = await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAddresses();
        showToast("Address deleted", "info");
        if (state.selectedAddressId === id) {
          dispatch({ type: "SELECT_ADDRESS", payload: null });
        }
      }
    } catch { /* ignore */ }
  }

  // ── Resolve shipping address from state ──────────────
  function getShippingAddress() {
    if (state.selectedAddressId) {
      const addr = state.addresses.find((a) => a.id === state.selectedAddressId);
      if (addr) return addr;
    }
    if (state.newAddress.name?.trim() || state.newAddress.line1?.trim()) {
      return state.newAddress;
    }
    return null;
  }

  // ── Place order ───────────────────────────────────────
  async function placeOrder() {
    dispatch({ type: "SET_PLACING_ORDER", payload: true });
    dispatch({ type: "SET_ORDER_ERROR", payload: null });
    fired.current = false;

    let shippingAddress;

    if (state.selectedAddressId) {
      const addr = state.addresses.find((a) => a.id === state.selectedAddressId);
      if (addr) shippingAddress = addr;
    }

    if (!shippingAddress) {
      shippingAddress = await saveNewAddressToServer();
      if (!shippingAddress) {
        dispatch({ type: "SET_PLACING_ORDER", payload: false });
        showToast("Please provide a valid delivery address", "error");
        return;
      }
    }

    try {
      const body = {
        items: state.cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceInPaise: priceInPaise(item),
        })),
        address: {
          name: shippingAddress.name,
          line1: shippingAddress.line1,
          city: shippingAddress.city,
          state: shippingAddress.state || "",
          country: shippingAddress.country || "India",
          phone: shippingAddress.phone,
          pincode: shippingAddress.pincode,
        },
        paymentMethod: state.paymentMethod,
        couponCode: state.coupon?.code || "",
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        dispatch({ type: "SET_ORDER_ERROR", payload: data.message || "Failed to place order" });
        showToast(data.message || "Failed to place order", "error");
        dispatch({ type: "SET_PLACING_ORDER", payload: false });
        return;
      }

      dispatch({ type: "SET_ORDER_RESULT", payload: data });
      localStorage.removeItem("commerce_cart");
      localStorage.removeItem(SAVE_KEY);

      if (state.paymentMethod === "cod") {
        router.push(data.redirectTo);
      } else {
        initiateRazorpay(data);
      }
    } catch (err) {
      dispatch({ type: "SET_ORDER_ERROR", payload: err.message });
      showToast("Unable to place order. Please try again.", "error");
      dispatch({ type: "SET_PLACING_ORDER", payload: false });
    }
  }

  function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      if (typeof window.Razorpay !== "undefined") {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay script"));
      document.body.appendChild(script);
    });
  }

  async function initiateRazorpay(orderData) {
    try {
      // Load Razorpay script if not already loaded
      try {
        await loadRazorpayScript();
      } catch {
        showToast("Failed to load payment gateway. Please try again.", "error");
        dispatch({ type: "SET_PLACING_ORDER", payload: false });
        return;
      }

      const res = await fetch("/api/payments/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderData.order.id }),
      });
      const payment = await res.json();

      if (!res.ok) {
        showToast(payment.message || "Payment initiation failed", "error");
        dispatch({ type: "SET_PLACING_ORDER", payload: false });
        return;
      }

      const options = {
        key: payment.keyId,
        amount: payment.amountInPaise,
        currency: payment.currency || "INR",
        name: "DR MART",
        description: `Order #${orderData.order.id?.toString().slice(-8).toUpperCase()}`,
        order_id: payment.razorpayOrderId,
        prefill: {
          name: payment.name || "",
          email: payment.email || "",
          contact: "",
        },
        theme: { color: "#0c3b35" },
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/payments/razorpay", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                localOrderId: payment.localOrderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (verifyRes.ok) {
              showToast("Payment successful!", "success");
              router.push(`/orders/success/${payment.localOrderId}`);
            } else {
              const errData = await verifyRes.json();
              showToast(errData.message || "Payment verification failed", "error");
              dispatch({ type: "SET_PLACING_ORDER", payload: false });
            }
          } catch {
            showToast("Payment verification error", "error");
            dispatch({ type: "SET_PLACING_ORDER", payload: false });
          }
        },
        modal: {
          ondismiss: function () {
            dispatch({ type: "SET_PLACING_ORDER", payload: false });
            showToast("Payment cancelled", "info");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        showToast(response.error?.description || "Payment failed", "error");
        dispatch({ type: "SET_PLACING_ORDER", payload: false });
      });
      rzp.open();
    } catch (err) {
      showToast("Unable to start payment. Please try again.", "error");
      dispatch({ type: "SET_PLACING_ORDER", payload: false });
    }
  }

  // ── Render ──────────────────────────────────────────────
  const currentStepIdx = STEPS.indexOf(state.step);
  const stepNames = { cart: "Cart", address: "Address", payment: "Payment", review: "Review" };

  return (
    <main className="luxury-shell min-h-screen text-[var(--text-primary)]">
      <StoreHeader cartCount={itemCount} />

      <section className="mx-auto max-w-7xl px-4 py-6">
        {/* ── Progress Indicator ──────────────────────── */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center justify-center min-w-max">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <button
                  type="button"
                  onClick={() => i <= currentStepIdx ? goToStep(s) : null}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap
                    ${i === currentStepIdx
                      ? "bg-[var(--brand-green)] text-white shadow-lg"
                      : i < currentStepIdx
                        ? "text-[var(--text-accent)] hover:bg-[var(--surface-secondary)]"
                        : "text-[var(--text-muted)]"}`}
                  disabled={i > currentStepIdx}
                >
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shrink-0
                    ${i === currentStepIdx ? "bg-white text-[var(--brand-green)]"
                      : i < currentStepIdx ? "bg-[var(--text-accent)] text-white"
                      : "bg-[var(--surface-secondary)] text-[var(--text-muted)]"}`}>
                    {i < currentStepIdx ? "✓" : i + 1}
                  </span>
                  <span className="hidden sm:inline">{stepNames[s]}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`mx-2 h-0.5 w-8 sm:w-12 rounded ${i <= currentStepIdx ? "bg-[var(--text-accent)]" : "bg-[var(--border-primary)]"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* ── Main Content ────────────────────────────── */}
          <div className="space-y-5">
            {state.step === "cart" && renderCartStep()}
            {state.step === "address" && renderAddressStep()}
            {state.step === "payment" && renderPaymentStep()}
            {state.step === "review" && renderReviewStep()}
          </div>

          {/* ── Sticky Order Summary ──────────────────── */}
          <aside className="lg:sticky lg:top-4 self-start space-y-4">
            <StickyOrderSummary
              cart={state.cart}
              totals={totals}
              coupon={state.coupon}
              couponCode={state.couponCode}
              couponLoading={state.couponLoading}
              couponError={state.couponError}
              onCouponChange={onCouponChange}
              onCouponApply={onCouponApply}
              onRemoveCoupon={() => dispatch({ type: "REMOVE_COUPON" })}
            />
          </aside>
        </div>
      </section>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  );

  // ═══════════════════════════════════════════════════════
  //  STEP RENDERERS
  // ═══════════════════════════════════════════════════════

  function renderCartStep() {
    return (
      <div className="glass-panel rounded-xl p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
          <h2 className="text-2xl font-black">Shopping Cart</h2>
          <StatusPill tone="ink">{itemCount} item{itemCount !== 1 ? "s" : ""}</StatusPill>
        </div>

        {state.cart.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-[var(--text-muted)] font-bold">Your cart is empty.</p>
            <Link href="/" className="mt-4 inline-block rounded-lg bg-[var(--brand-green)] px-8 py-3 font-bold text-white hover:shadow-lg transition-all">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {state.cart.map((item) => (
              <div key={item.productId}
                className="flex gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4 transition-all hover:shadow-sm">
                <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-secondary)] p-2 flex items-center justify-center">
                  <img alt={item.title} className="h-full w-full object-contain" src={item.image} />
                </div>
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <Link href={`/product/${item.productId}`}
                      className="font-bold text-sm sm:text-base hover:text-[var(--text-accent)] line-clamp-1">
                      {item.title}
                    </Link>
                    <p className="mt-1 text-sm font-bold text-[var(--text-accent)]">
                      {moneyFromPaise(priceInPaise(item) * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button className="h-8 w-8 rounded-lg border border-[var(--border-secondary)] text-sm font-bold hover:bg-[var(--surface-secondary)]"
                      onClick={() => updateQty(item.productId, item.quantity - 1)}>-</button>
                    <span className="min-w-8 text-center font-bold">{item.quantity}</span>
                    <button className="h-8 w-8 rounded-lg border border-[var(--border-secondary)] text-sm font-bold hover:bg-[var(--surface-secondary)]"
                      onClick={() => updateQty(item.productId, item.quantity + 1)}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {state.cart.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
            <Link href="/"
              className="rounded-lg border border-[var(--border-primary)] px-5 py-3 text-sm font-bold text-center hover:bg-[var(--surface-secondary)] transition-all">
              ← Continue Shopping
            </Link>
            <button type="button"
              onClick={() => goToStep("address")}
              className="rounded-lg bg-[var(--brand-green)] px-8 py-3 text-sm font-bold text-white hover:shadow-lg transition-all">
              Proceed to Address →
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderAddressStep() {
    const addr = state.newAddress;

    return (
      <div className="glass-panel rounded-xl p-5 sm:p-6">
        <h2 className="text-2xl font-black border-b border-[var(--border-primary)] pb-4">Delivery Address</h2>

        {/* Saved Addresses */}
        {state.addressesLoading ? (
          <div className="mt-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-[var(--border-primary)] p-4">
                <div className="h-4 w-48 rounded bg-[var(--skeleton-base)]" />
                <div className="mt-2 h-3 w-64 rounded bg-[var(--skeleton-base)]" />
              </div>
            ))}
          </div>
        ) : state.addresses.length > 0 ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-bold text-[var(--text-muted)]">Saved Addresses</p>
            {state.addresses.map((a) => (
              <div key={a.id}
                className={`rounded-xl border-2 p-4 cursor-pointer transition-all
                  ${state.selectedAddressId === a.id
                    ? "border-[var(--brand-green)] bg-[var(--surface-primary)] shadow-sm"
                    : "border-[var(--border-primary)] hover:border-[var(--border-secondary)]"}`}
                onClick={() => dispatch({ type: "SELECT_ADDRESS", payload: a.id })}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <input type="radio" checked={state.selectedAddressId === a.id} readOnly
                      className="mt-0.5 accent-[var(--brand-green)]" />
                    <div>
                      <p className="font-bold text-sm">{a.name} <span className="text-[var(--text-muted)] font-normal">· {a.phone}</span></p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{a.line1}, {a.city}{a.state ? `, ${a.state}` : ""} - {a.pincode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.is_default && <StatusPill tone="green">Default</StatusPill>}
                    <button type="button" onClick={(e) => { e.stopPropagation(); deleteAddress(a.id); }}
                      className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* New Address Form */}
        <div className="mt-6">
          <p className="text-sm font-bold text-[var(--text-muted)] mb-4">
            {state.addresses.length > 0 ? "Or add a new address" : "Add a delivery address"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Full Name *" value={addr.name}
              onChange={(v) => updateNewAddress("name", v)}
              error={state.addressErrors.name} placeholder="John Doe" />
            <InputField label="Phone *" value={addr.phone}
              onChange={(v) => updateNewAddress("phone", v.replace(/\D/g, "").slice(0, 10))}
              error={state.addressErrors.phone} placeholder="9876543210" type="tel" />
            <div className="sm:col-span-2">
              <InputField label="Address (Flat / House No., Street, Area) *" value={addr.line1}
                onChange={(v) => updateNewAddress("line1", v)}
                error={state.addressErrors.line1} placeholder="123, Main Street, Apartment 4B" />
            </div>
            <InputField label="Pincode *" value={addr.pincode}
              onChange={onPincodeChange}
              error={state.addressErrors.pincode || state.pincodeError} placeholder="6-digit pincode" />
            <InputField label="City *" value={addr.city}
              onChange={(v) => updateNewAddress("city", v)}
              error={state.addressErrors.city} placeholder="Auto-filled from pincode"
              suffix={state.pincodeLoading ? "⏳" : state.pincodeData?.city ? "✅" : ""} />
            <InputField label="State" value={addr.state}
              onChange={(v) => updateNewAddress("state", v)}
              placeholder="Auto-filled from pincode"
              suffix={state.pincodeLoading ? "⏳" : state.pincodeData?.state ? "✅" : ""} />
            <InputField label="Country" value={addr.country}
              onChange={(v) => updateNewAddress("country", v)} disabled />
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] mb-1.5 block">Address Type</label>
              <div className="flex gap-2">
                {["home", "work"].map((t) => (
                  <button key={t} type="button"
                    onClick={() => updateNewAddress("addressType", t)}
                    className={`rounded-lg px-4 py-2.5 text-sm font-bold border transition-all flex-1
                      ${addr.addressType === t
                        ? "border-[var(--brand-green)] bg-[var(--brand-green)]/5 text-[var(--brand-green)]"
                        : "border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--surface-secondary)]"}`}
                  >
                    {t === "home" ? "🏠 Home" : "💼 Work"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
          <button type="button" onClick={() => goToStep("cart")}
            className="rounded-lg border border-[var(--border-primary)] px-5 py-3 text-sm font-bold hover:bg-[var(--surface-secondary)] transition-all">
            ← Back to Cart
          </button>
          <button type="button" onClick={() => {
            if (state.selectedAddressId || validateAddressForm(addr)) {
              goToStep("payment");
            } else {
              showToast("Please fill in all required address fields", "error");
            }
          }}
            className="rounded-lg bg-[var(--brand-green)] px-8 py-3 text-sm font-bold text-white hover:shadow-lg transition-all">
            Continue to Payment →
          </button>
        </div>
      </div>
    );
  }

  function renderPaymentStep() {
    return (
      <div className="glass-panel rounded-xl p-5 sm:p-6">
        <h2 className="text-2xl font-black border-b border-[var(--border-primary)] pb-4">Payment Method</h2>

        <div className="mt-6 space-y-3">
          <PaymentOption
            selected={state.paymentMethod === "razorpay"}
            onSelect={() => dispatch({ type: "SET_PAYMENT_METHOD", payload: "razorpay" })}
            icon="💳"
            title="Pay Online (Card / UPI / Wallet)"
            description="Secure payments via Razorpay. All major cards, UPI, Net Banking accepted."
          />
          <PaymentOption
            selected={state.paymentMethod === "cod"}
            onSelect={() => dispatch({ type: "SET_PAYMENT_METHOD", payload: "cod" })}
            icon="💵"
            title="Cash on Delivery"
            description="Pay in cash when your order is delivered."
          />
        </div>

        {state.paymentMethod === "cod" && (
          <div className="mt-4 rounded-lg bg-[var(--badge-gold-bg)] p-3 text-xs text-[var(--badge-gold-text)]">
            💡 A delivery fee may apply based on your location. Cash payment is collected at your doorstep.
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
          <button type="button" onClick={() => goToStep("address")}
            className="rounded-lg border border-[var(--border-primary)] px-5 py-3 text-sm font-bold hover:bg-[var(--surface-secondary)] transition-all">
            ← Back to Address
          </button>
          <button type="button" onClick={() => goToStep("review")}
            className="rounded-lg bg-[var(--brand-green)] px-8 py-3 text-sm font-bold text-white hover:shadow-lg transition-all">
            Review Order →
          </button>
        </div>
      </div>
    );
  }

  function renderReviewStep() {
    const selectedAddr = state.selectedAddressId
      ? state.addresses.find((a) => a.id === state.selectedAddressId)
      : state.newAddress;

    const hasAddress = selectedAddr && (selectedAddr.name?.trim() || selectedAddr.line1?.trim());

    return (
      <div className="glass-panel rounded-xl p-5 sm:p-6">
        <h2 className="text-2xl font-black border-b border-[var(--border-primary)] pb-4">Review Your Order</h2>

        {/* Address review */}
        <div className="mt-4 rounded-xl border border-[var(--border-primary)] p-4 bg-[var(--surface-primary)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">📦 Delivering to</p>
            <button type="button" onClick={() => goToStep("address")}
              className="text-xs font-bold text-[var(--text-accent)] hover:underline">Change</button>
          </div>
          {hasAddress ? (
            <>
              <p className="font-bold text-sm">{selectedAddr.name} — {selectedAddr.phone}</p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {selectedAddr.line1}, {selectedAddr.city}{selectedAddr.state ? `, ${selectedAddr.state}` : ""} — {selectedAddr.pincode}
              </p>
            </>
          ) : (
            <p className="text-sm text-red-500">No address provided. Please add a delivery address.</p>
          )}
        </div>

        {/* Items review */}
        {state.cart.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">Items ({itemCount})</p>
            {state.cart.map((item) => (
              <div key={item.productId}
                className="flex items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-secondary)] p-1 flex items-center justify-center">
                  <img alt={item.title} className="h-full w-full object-contain" src={item.image} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold line-clamp-1">{item.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">Qty: {item.quantity} × {moneyFromPaise(priceInPaise(item))}</p>
                </div>
                <p className="text-sm font-black shrink-0">{moneyFromPaise(priceInPaise(item) * item.quantity)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Payment method review */}
        <div className="mt-3 rounded-xl border border-[var(--border-primary)] p-4 bg-[var(--surface-primary)]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">💳 Payment</p>
            <button type="button" onClick={() => goToStep("payment")}
              className="text-xs font-bold text-[var(--text-accent)] hover:underline">Change</button>
          </div>
          <p className="font-bold text-sm">
            {state.paymentMethod === "razorpay" ? "💳 Pay Online (Card / UPI / Wallet)" : "💵 Cash on Delivery"}
          </p>
        </div>

        {/* Order Error display */}
        {state.orderError && (
          <div className="mt-4 rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 font-medium">
            ⚠️ {state.orderError}
          </div>
        )}

        {/* Place Order Button */}
        <button
          type="button"
          disabled={state.placingOrder || state.cart.length === 0 || !hasAddress}
          onClick={placeOrder}
          className="mt-6 w-full rounded-xl bg-[var(--brand-green)] px-6 py-4 text-base font-black text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:shadow-xl hover:shadow-[var(--brand-green)]/20 transition-all
            flex items-center justify-center gap-3"
        >
          {state.placingOrder ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </>
          ) : (
            `Place Order · ${totals.finalF}`
          )}
        </button>

        {state.paymentMethod === "razorpay" && !state.placingOrder && (
          <p className="mt-3 text-xs text-center text-[var(--text-muted)]">
            🔒 Secure payment via Razorpay. Your payment info is encrypted.
          </p>
        )}
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════
//  STICKY ORDER SUMMARY COMPONENT
// ═══════════════════════════════════════════════════════════

function StickyOrderSummary({ cart, totals, coupon, couponCode, couponLoading, couponError, onCouponChange, onCouponApply, onRemoveCoupon }) {
  return (
    <div className="glass-panel rounded-xl p-5">
      <h3 className="text-lg font-black border-b border-[var(--border-primary)] pb-3">Order Summary</h3>

      {/* Items list */}
      <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
        {cart.slice(0, 5).map((item) => (
          <div key={item.productId} className="flex items-center gap-2 text-sm">
            <span className="h-6 w-6 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center text-xs font-bold shrink-0">
              {item.quantity}
            </span>
            <span className="flex-1 truncate text-[var(--text-muted)]">{item.title}</span>
            <span className="font-bold shrink-0">{moneyFromPaise(priceInPaise(item) * item.quantity)}</span>
          </div>
        ))}
        {cart.length > 5 && (
          <p className="text-xs text-[var(--text-muted)] text-center pt-1">+{cart.length - 5} more items</p>
        )}
      </div>

      {/* Totals breakdown */}
      <div className="mt-4 space-y-2.5 text-sm border-t border-[var(--border-primary)] pt-4">
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Subtotal</span>
          <strong>{totals.subtotalF}</strong>
        </div>

        {totals.discountAmount > 0 && (
          <div className="flex justify-between text-[var(--brand-green)]">
            <span>Discount</span>
            <strong>-{totals.discountF}</strong>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Shipping</span>
          <strong className={totals.freeShipping ? "text-[var(--brand-green)]" : ""}>
            {totals.freeShipping ? "FREE" : totals.shippingF}
          </strong>
        </div>

        {!totals.freeShipping && totals.subtotal < 49900 && (
          <p className="text-xs text-[var(--text-muted)]">
            🚚 Add {moneyFromPaise(49900 - totals.subtotal)} more for free shipping
          </p>
        )}

        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Tax (GST 12%)</span>
          <strong>{totals.taxF}</strong>
        </div>

        <div className="flex justify-between border-t border-[var(--border-primary)] pt-3 text-lg font-black">
          <span>Total</span>
          <span>{totals.finalF}</span>
        </div>
      </div>

      {/* Coupon section */}
      <div className="mt-4 border-t border-[var(--border-primary)] pt-4">
        {coupon ? (
          <div className="flex items-center justify-between rounded-xl bg-[var(--brand-green)]/10 p-3 text-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--brand-green)]">🎉 {coupon.code}</span>
                <span className="text-xs bg-[var(--brand-green)] text-white px-2 py-0.5 rounded-full font-bold">
                  {coupon.discount_type === "percent" ? `${coupon.discount_value}% OFF` :
                   coupon.discount_type === "fixed" ? `₹${coupon.discount_value} OFF` : "FREE SHIPPING"}
                </span>
              </div>
              {coupon.description && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{coupon.description}</p>
              )}
            </div>
            <button type="button" onClick={onRemoveCoupon}
              className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">✕</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => onCouponChange(e.target.value)}
              placeholder="Enter coupon code"
              className="flex-1 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)]/30 focus:border-[var(--brand-green)]"
            />
            <button type="button" onClick={onCouponApply}
              disabled={!couponCode.trim() || couponLoading}
              className="rounded-lg bg-[var(--brand-green)] px-4 py-2.5 text-sm font-bold text-white
                disabled:opacity-50 hover:shadow-md transition-all">
              {couponLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : "Apply"}
            </button>
          </div>
        )}
        {couponError && (
          <p className="mt-1.5 text-xs text-red-500">{couponError}</p>
        )}
      </div>
    </div>
  );
}

// ─── Reusable input component ──────────────────────────
function InputField({ label, value, onChange, error, placeholder, type = "text", disabled = false, suffix }) {
  return (
    <div>
      <label className="text-xs font-bold text-[var(--text-muted)] mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-11 rounded-xl border px-3.5 text-sm transition-all
            ${disabled ? "bg-[var(--surface-secondary)] text-[var(--text-muted)] cursor-not-allowed" : "bg-[var(--input-bg)]"}
            ${error ? "border-red-400 ring-1 ring-red-200" : "border-[var(--input-border)] focus:ring-2 focus:ring-[var(--brand-green)]/30"}
            focus:outline-none focus:border-[var(--brand-green)]`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">{suffix}</span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Payment option component ──────────────────────────
function PaymentOption({ selected, onSelect, icon, title, description }) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all
        ${selected
          ? "border-[var(--brand-green)] bg-[var(--brand-green)]/5 shadow-sm"
          : "border-[var(--border-primary)] hover:border-[var(--border-secondary)] hover:bg-[var(--surface-secondary)]"}`}
    >
      <input type="radio" checked={selected} readOnly className="accent-[var(--brand-green)] shrink-0" />
      <span className="text-2xl shrink-0">{icon}</span>
      <div>
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
      </div>
    </div>
  );
}