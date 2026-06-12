"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/seller/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/seller/products",   label: "Products",  icon: "📦" },
  { href: "/seller/orders",     label: "Orders",    icon: "📋" },
  { href: "/seller/analytics",  label: "Analytics", icon: "📈" },
  { href: "/seller/coupons",    label: "Coupons",   icon: "🎟️" },
  { href: "/seller/payouts",    label: "Payouts",   icon: "💰" },
  { href: "/seller/messages",   label: "Messages",  icon: "💬" },
  { href: "/seller/bulk-upload",label: "Bulk Upload",icon: "📤" },
  { href: "/seller/settings",   label: "Settings",  icon: "⚙️" },
];

export default function SellerNav() {
  const pathname = usePathname();

  return (
    <nav className="seller-nav" aria-label="Seller navigation">
      {links.map(({ href, label, icon }) => {
        const active =
          pathname === href || (href !== "/seller/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`seller-nav-link${active ? " active" : ""}`}
          >
            <span className="seller-nav-icon">{icon}</span>
            <span className="seller-nav-label">{label}</span>
            {active && <span className="seller-nav-active-indicator" />}
          </Link>
        );
      })}
    </nav>
  );
}