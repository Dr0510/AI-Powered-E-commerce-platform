import SellerNav from "@/components/SellerNav";

export default function SellerLayout({ children }) {
  return (
    <div className="seller-layout">
      <SellerNav />
      <main className="seller-content">{children}</main>
    </div>
  );
}