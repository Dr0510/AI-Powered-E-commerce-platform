"use client";

/* ─── Generic skeleton building blocks ─── */
function SkeletonBox({ className = "", style = {} }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

/* ─── Product Grid Skeleton ─── */
export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card stagger-in" style={{ animationDelay: `${i * 80}ms` }}>
          <SkeletonBox className="skeleton-img" />
          <SkeletonBox className="skeleton-text" style={{ width: "40%" }} />
          <SkeletonBox className="skeleton-text" style={{ width: "70%" }} />
          <SkeletonBox className="skeleton-text-sm" style={{ width: "50%" }} />
          <SkeletonBox className="skeleton-text-sm" style={{ width: "30%" }} />
        </div>
      ))}
    </div>
  );
}

/* ─── Product Detail Skeleton ─── */
export function ProductDetailSkeleton() {
  return (
    <div className="stagger-in">
      <div className="grid gap-5 lg:grid-cols-[460px_1fr_320px]">
        {/* Image */}
        <div className="skeleton-card">
          <SkeletonBox style={{ height: 360, borderRadius: 12 }} />
          <div className="grid grid-cols-5 gap-2 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBox key={i} style={{ height: 60, borderRadius: 8 }} />
            ))}
          </div>
        </div>
        {/* Info */}
        <div className="skeleton-card">
          <SkeletonBox className="skeleton-text-sm" style={{ width: "30%" }} />
          <SkeletonBox className="skeleton-heading" style={{ width: "80%" }} />
          <SkeletonBox className="skeleton-text" style={{ width: "60%" }} />
          <SkeletonBox style={{ height: 32, width: "40%", borderRadius: 6 }} />
          <SkeletonBox className="skeleton-text" />
          <SkeletonBox className="skeleton-text" style={{ width: "90%" }} />
          <SkeletonBox className="skeleton-text" style={{ width: "70%" }} />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <SkeletonBox style={{ height: 80, borderRadius: 12 }} />
            <SkeletonBox style={{ height: 80, borderRadius: 12 }} />
          </div>
        </div>
        {/* Sidebar */}
        <div className="skeleton-card">
          <SkeletonBox style={{ height: 28, width: "50%", borderRadius: 6 }} />
          <SkeletonBox className="skeleton-text-sm" style={{ width: "60%" }} />
          <SkeletonBox style={{ height: 44, borderRadius: 8 }} />
          <SkeletonBox style={{ height: 44, borderRadius: 8 }} />
          <SkeletonBox style={{ height: 44, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Orders Skeleton ─── */
export function OrdersSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card stagger-in" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <SkeletonBox className="skeleton-text" style={{ width: "40%" }} />
              <SkeletonBox className="skeleton-text-sm" style={{ width: "25%" }} />
            </div>
            <SkeletonBox style={{ height: 24, width: 80, borderRadius: 6 }} />
          </div>
          <div className="grid grid-cols-5 gap-2 mt-3">
            {Array.from({ length: 5 }).map((_, j) => (
              <SkeletonBox key={j} style={{ height: 36, borderRadius: 8 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Profile Skeleton ─── */
export function ProfileSkeleton() {
  return (
    <div className="stagger-in">
      {/* Hero */}
      <div className="skeleton-card" style={{ borderRadius: 16 }}>
        <SkeletonBox className="skeleton-text-sm" style={{ width: "30%" }} />
        <SkeletonBox className="skeleton-heading" style={{ width: "50%" }} />
        <SkeletonBox className="skeleton-text" style={{ width: "70%" }} />
      </div>
      {/* Grid */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr]">
        <div className="skeleton-card">
          <SkeletonBox className="skeleton-heading" style={{ width: "40%" }} />
          <SkeletonBox className="skeleton-text" />
          <SkeletonBox className="skeleton-text" />
          <SkeletonBox className="skeleton-text" style={{ width: "60%" }} />
          <SkeletonBox style={{ height: 40, borderRadius: 8, marginTop: 12 }} />
        </div>
        <div className="space-y-5">
          <div className="skeleton-card">
            <SkeletonBox className="skeleton-heading" style={{ width: "40%" }} />
            <div className="grid gap-3 md:grid-cols-2 mt-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBox key={i} style={{ height: 80, borderRadius: 12 }} />
              ))}
            </div>
          </div>
          <div className="skeleton-card">
            <SkeletonBox className="skeleton-heading" style={{ width: "40%" }} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonBox key={i} style={{ height: 120, borderRadius: 12 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Cart Skeleton ─── */
export function CartSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card stagger-in" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="grid gap-4 sm:grid-cols-[120px_1fr_auto]">
            <SkeletonBox style={{ height: 100, width: 100, borderRadius: 12 }} />
            <div className="flex-1">
              <SkeletonBox className="skeleton-text" style={{ width: "70%" }} />
              <SkeletonBox className="skeleton-text-sm" style={{ width: "40%" }} />
              <div className="flex gap-2 mt-3">
                <SkeletonBox style={{ height: 32, width: 32, borderRadius: 6 }} />
                <SkeletonBox style={{ height: 32, width: 40, borderRadius: 6 }} />
                <SkeletonBox style={{ height: 32, width: 32, borderRadius: 6 }} />
              </div>
            </div>
            <SkeletonBox style={{ height: 24, width: 80, borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Tab Content Skeleton (for AI Hub etc.) ─── */
export function TabContentSkeleton() {
  return (
    <div className="space-y-4 py-8">
      <SkeletonBox className="skeleton-heading" />
      <SkeletonBox className="skeleton-text" />
      <SkeletonBox className="skeleton-text" style={{ width: "80%" }} />
      <SkeletonBox className="skeleton-text" style={{ width: "60%" }} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <SkeletonBox style={{ height: 120, borderRadius: 14 }} />
        <SkeletonBox style={{ height: 120, borderRadius: 14 }} />
      </div>
    </div>
  );
}
