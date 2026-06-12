"use client";

import { useState, useEffect } from "react";
import SellerNav from "@/components/SellerNav";
import SellerHeader from "@/components/SellerHeader";

export default function SellerLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [seller, setSeller] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="seller-page min-h-screen">
      <SellerNav
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className={`relative transition-all duration-300 min-h-screen ${sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[260px]"}`}>
        <SellerHeader seller={seller} scrolled={scrolled} />

        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}