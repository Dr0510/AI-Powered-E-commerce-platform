"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { discountFor, money, ratingFor } from "@/lib/format";

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

function updateLocalList(key, item, idKey = "productId") {
  const current = JSON.parse(localStorage.getItem(key) || "[]");
  const exists = current.find((entry) => entry[idKey] === item[idKey]);
  const next = exists ? current : [item, ...current];
  localStorage.setItem(key, JSON.stringify(next));
  return next.length;
}

export default function ProductPage({ params }) {
  const { id } = use(params);
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [status, setStatus] = useState("Loading product...");

  useEffect(() => {
    async function load() {
      const productData = await api(`/api/products/${id}`);
      setProduct(productData.product);
      setStatus("Ready");

      updateLocalList("dr_recently_viewed", {
        productId: productData.product._id,
        title: productData.product.title,
        price: productData.product.price,
        image: productData.product.image,
      });

      const [relatedData, reviewData] = await Promise.all([
        api(`/api/products?category=${encodeURIComponent(productData.product.category)}`),
        api(`/api/reviews?productId=${id}`),
      ]);
      setRelated(relatedData.products.filter((item) => item._id !== id).slice(0, 4));
      setReviews(reviewData.reviews);
    }

    load().catch((error) => setStatus(error.message));
  }, [id]);

  function addToCart() {
    updateLocalList("commerce_cart", {
      productId: product._id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
    setStatus("Added to cart");
  }

  function addToWishlist() {
    updateLocalList("dr_wishlist", {
      productId: product._id,
      title: product.title,
      price: product.price,
      image: product.image,
      category: product.category,
    });
    setStatus("Added to wishlist");
  }

  async function submitReview(event) {
    event.preventDefault();
    try {
      const data = await api("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ productId: product._id, ...review }),
      });
      setReviews([data.review, ...reviews]);
      setReview({ rating: 5, comment: "" });
      setStatus("Review added");
    } catch (error) {
      setStatus(error.message);
    }
  }

  if (!product) {
    return <main className="min-h-screen bg-slate-100 p-6 text-slate-900">{status}</main>;
  }

  const discount = discountFor(product);
  const mrp = product.price / (1 - discount / 100);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="bg-[#131921] px-4 py-3 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/"><img alt="DR Group" className="h-10" src="/dr-group-logo.svg" /></Link>
          <nav className="flex gap-4 text-sm font-bold">
            <Link href="/cart">Cart</Link>
            <Link href="/wishlist">Wishlist</Link>
            <Link href="/assistant">AI Assistant</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 p-4 lg:grid-cols-[420px_1fr_300px]">
        <div className="rounded bg-white p-5 shadow-sm">
          <img alt={product.title} className="aspect-square w-full object-contain" src={product.image} />
        </div>
        <section className="rounded bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase text-blue-700">{product.category}</p>
          <h1 className="mt-2 text-3xl font-black">{product.title}</h1>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded bg-green-700 px-2 py-1 text-sm font-bold text-white">{ratingFor(product)} star</span>
            <span className="text-sm text-slate-500">{reviews.length} reviews</span>
          </div>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-4xl font-black">{money(product.price)}</span>
            <span className="text-slate-400 line-through">{money(mrp)}</span>
            <span className="font-bold text-green-700">{discount}% off</span>
          </div>
          <p className="mt-5 leading-7 text-slate-700">{product.description}</p>
          <div className="mt-5 rounded border border-green-200 bg-green-50 p-4 text-sm">
            <strong>DR Assured:</strong> Free delivery, 7-day replacement, verified seller from DR Group network.
          </div>
        </section>
        <aside className="rounded bg-white p-5 shadow-sm">
          <p className="text-2xl font-black">{money(product.price)}</p>
          <p className="mt-2 text-sm text-green-700">In stock: {product.stock}</p>
          <button className="mt-4 w-full rounded-full bg-[#ffd814] px-4 py-3 font-black" onClick={addToCart} type="button">
            Add to Cart
          </button>
          <button className="mt-3 w-full rounded-full bg-[#ffa41c] px-4 py-3 font-black" onClick={addToCart} type="button">
            Buy Now
          </button>
          <button className="mt-3 w-full rounded border border-slate-300 px-4 py-3 font-bold" onClick={addToWishlist} type="button">
            Add to Wishlist
          </button>
          <p className="mt-4 text-sm text-slate-500">{status}</p>
        </aside>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 p-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Frequently bought together</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <Link className="rounded border border-slate-200 p-3" href={`/product/${item._id}`} key={item._id}>
                <img alt={item.title} className="h-28 w-full object-contain" src={item.image} />
                <p className="mt-2 line-clamp-2 text-sm font-bold">{item.title}</p>
                <p className="text-sm font-black">{money(item.price)}</p>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Reviews</h2>
          <form className="mt-4 space-y-3" onSubmit={submitReview}>
            <select className="w-full rounded border p-2" onChange={(event) => setReview({ ...review, rating: event.target.value })} value={review.rating}>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star</option>)}
            </select>
            <textarea className="w-full rounded border p-2" onChange={(event) => setReview({ ...review, comment: event.target.value })} placeholder="Write a review" value={review.comment} />
            <button className="rounded bg-slate-900 px-4 py-2 font-bold text-white" type="submit">Submit Review</button>
          </form>
          <div className="mt-4 space-y-3">
            {reviews.map((item) => (
              <div className="rounded bg-slate-50 p-3" key={item._id}>
                <p className="font-bold">{item.rating} star • {item.userName}</p>
                <p className="text-sm text-slate-600">{item.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
