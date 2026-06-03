"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import AuthControls from "@/components/AuthControls";
import { api } from "@/lib/api";
import { money } from "@/lib/format";

const emptyProduct = {
  title: "",
  description: "",
  price: "",
  category: "General",
  stock: 10,
  tags: "",
  active: true,
  image: "",
  images: [],
};

const fulfillmentOptions = ["unfulfilled", "packed", "shipped", "delivered", "cancelled"];

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState("Loading dashboard...");
  const [busy, setBusy] = useState(false);

  const canUpload = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

  async function loadAdmin() {
    const [statsData, productData, orderData] = await Promise.all([
      api("/api/admin/stats"),
      api("/api/products?includeInactive=true"),
      api("/api/orders?admin=true"),
    ]);
    setStats(statsData);
    setProducts(productData.products);
    setOrders(orderData.orders);
    setStatus("Live store snapshot");
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAdmin().catch((error) => setStatus(error.message));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const activeProducts = useMemo(
    () => products.filter((product) => product.active !== false).length,
    [products],
  );

  function editProduct(product) {
    setEditingId(product._id);
    setForm({
      title: product.title || "",
      description: product.description || "",
      price: product.price || "",
      category: product.category || "General",
      stock: product.stock || 0,
      tags: (product.tags || []).join(", "),
      active: product.active !== false,
      image: product.image || "",
      images: product.images || [],
    });
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyProduct);
  }

  async function saveProduct(event) {
    event.preventDefault();
    setBusy(true);
    setStatus(editingId ? "Updating product..." : "Creating product...");

    try {
      const saved = await api(editingId ? `/api/products/${editingId}` : "/api/products", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      setProducts((current) => {
        const exists = current.some((product) => product._id === saved.product._id);
        return exists
          ? current.map((product) => (product._id === saved.product._id ? saved.product : product))
          : [saved.product, ...current];
      });
      resetForm();
      await loadAdmin();
      setStatus("Product saved");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function archiveProduct(productId) {
    setBusy(true);
    try {
      await api(`/api/products/${productId}`, { method: "DELETE" });
      await loadAdmin();
      setStatus("Product archived");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateOrder(orderId, fulfillmentStatus) {
    setBusy(true);
    try {
      const data = await api("/api/orders", {
        method: "PATCH",
        body: JSON.stringify({ orderId, fulfillmentStatus }),
      });
      setOrders((current) => current.map((order) => (order._id === orderId ? data.order : order)));
      setStatus("Order updated");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  function handleUpload(result) {
    const info = result.info;
    if (!info?.secure_url) {
      return;
    }

    setForm((current) => ({
      ...current,
      image: info.secure_url,
      images: [
        {
          url: info.secure_url,
          publicId: info.public_id,
          width: info.width,
          height: info.height,
          alt: current.title,
        },
      ],
    }));
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="bg-[#131921] px-4 py-3 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link className="font-black" href="/">DR Mart Admin</Link>
          <nav className="flex items-center gap-4 text-sm font-bold">
            <Link href="/">Storefront</Link>
            <Link href="/orders">Orders</Link>
            <AuthControls compact />
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl p-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-black">Admin Dashboard</h1>
            <p className="mt-2 text-slate-500">{status}</p>
          </div>
          <button
            className="rounded bg-slate-900 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
            disabled={busy}
            onClick={() => loadAdmin().catch((error) => setStatus(error.message))}
            type="button"
          >
            Refresh
          </button>
        </div>

        {stats ? (
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <Metric label="Revenue" value={money(stats.revenue)} />
            <Metric label="Orders" value={stats.orders} />
            <Metric label="Active Products" value={activeProducts} />
            <Metric label="Users" value={stats.users} />
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-[420px_1fr]">
          <section className="rounded bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">{editingId ? "Edit product" : "Create product"}</h2>
              {editingId ? (
                <button className="text-sm font-bold text-blue-700" onClick={resetForm} type="button">
                  New
                </button>
              ) : null}
            </div>

            <form className="mt-4 space-y-3" onSubmit={saveProduct}>
              <input className="w-full rounded border p-2" onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Title" value={form.title} />
              <textarea className="min-h-24 w-full rounded border p-2" onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" value={form.description} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="w-full rounded border p-2" onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Price in INR" type="number" value={form.price} />
                <input className="w-full rounded border p-2" onChange={(event) => setForm({ ...form, stock: event.target.value })} placeholder="Stock" type="number" value={form.stock} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="w-full rounded border p-2" onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Category" value={form.category} />
                <input className="w-full rounded border p-2" onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="Tags, comma separated" value={form.tags} />
              </div>
              <label className="flex items-center gap-2 text-sm font-bold">
                <input checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} type="checkbox" />
                Active product
              </label>

              <div className="rounded border border-slate-200 p-3">
                {form.image ? <img alt="" className="mb-3 h-40 w-full rounded object-contain bg-slate-50" src={form.image} /> : null}
                <input className="mb-3 w-full rounded border p-2 text-sm" onChange={(event) => setForm({ ...form, image: event.target.value, images: event.target.value ? [{ url: event.target.value, alt: form.title }] : [] })} placeholder="Image URL fallback" value={form.image} />
                {canUpload ? (
                  <CldUploadWidget
                    onSuccess={handleUpload}
                    options={{
                      folder: "dr-mart/products",
                      maxFiles: 1,
                      multiple: false,
                      resourceType: "image",
                      sources: ["local", "url", "camera"],
                    }}
                    signatureEndpoint="/api/cloudinary/sign"
                  >
                    {({ open }) => (
                      <button className="rounded bg-[#2874f0] px-4 py-2 text-sm font-black text-white" onClick={() => open()} type="button">
                        Upload with Cloudinary
                      </button>
                    )}
                  </CldUploadWidget>
                ) : (
                  <p className="text-xs text-amber-700">Add Cloudinary env vars to enable signed uploads.</p>
                )}
              </div>

              <button className="w-full rounded bg-[#ffd814] px-4 py-3 font-black disabled:opacity-50" disabled={busy} type="submit">
                {editingId ? "Update product" : "Create product"}
              </button>
            </form>
          </section>

          <section className="rounded bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">Catalog</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {products.map((product) => (
                <article className={`rounded border p-3 ${product.active === false ? "border-slate-200 bg-slate-50 opacity-70" : "border-slate-200"}`} key={product._id}>
                  <div className="flex gap-3">
                    <img alt="" className="h-20 w-20 rounded bg-slate-50 object-contain" src={product.image} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black">{product.title}</p>
                      <p className="text-sm text-slate-500">{product.category}</p>
                      <p className="font-black">{money(product.price)} · {product.stock} left</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="rounded border px-3 py-1 text-sm font-bold" onClick={() => editProduct(product)} type="button">Edit</button>
                    <button className="rounded bg-red-50 px-3 py-1 text-sm font-bold text-red-700 disabled:opacity-50" disabled={busy || product.active === false} onClick={() => archiveProduct(product._id)} type="button">Archive</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Orders</h2>
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <article className="rounded border border-slate-200 p-4" key={order._id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black">Order #{order._id.slice(-8)}</p>
                    <p className="text-sm text-slate-500">{order.customer?.name || "Customer"} · {order.customer?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black">{money(order.total)}</p>
                    <p className="text-xs uppercase text-green-700">{order.status}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    className="rounded border p-2 text-sm"
                    disabled={busy}
                    onChange={(event) => updateOrder(order._id, event.target.value)}
                    value={order.fulfillmentStatus}
                  >
                    {fulfillmentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <span className="rounded bg-slate-100 px-3 py-2 text-sm font-bold">{order.items.length} items</span>
                </div>
              </article>
            ))}
            {!orders.length ? <p className="rounded bg-slate-50 p-4 text-slate-500">No orders yet.</p> : null}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <section className="rounded bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </section>
  );
}
