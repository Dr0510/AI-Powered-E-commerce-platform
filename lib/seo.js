// SEO utilities for meta tags and structured data

export function generateProductSchema(product) {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.image,
    brand: {
      "@type": "Brand",
      name: "DR MART",
    },
    offers: {
      "@type": "Offer",
      url: `https://drmart.example.com/product/${product._id}`,
      priceCurrency: "INR",
      price: (product.priceInPaise / 100).toString(),
      availability: product.stock > 0 ? "InStock" : "OutOfStock",
    },
    category: product.category,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: "10",
    },
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DR MART by DR Group",
    url: "https://drmart.example.com",
    logo: "https://drmart.example.com/logo.png",
    description: "Your ultimate luxury marketplace from DR MART by DR Group",
    sameAs: [
      "https://twitter.com/drmart",
      "https://facebook.com/drmart",
    ],
  };
}

export function generateBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export const defaultMetaTags = {
  title: "DR MART by DR Group - Premium Luxury Store",
  description: "Shop luxury products with curated service, premium checkout, and refined delivery.",
  keywords: "luxury, premium store, curated marketplace, DR MART, DR Group",
  author: "DR MART by DR Group",
  "og:title": "DR MART by DR Group - Premium Luxury Store",
  "og:description": "Shop luxury products with curated service and premium delivery",
  "og:type": "website",
  "og:image": "https://drmart.example.com/og-image.png",
  "twitter:card": "summary_large_image",
  "twitter:title": "DR MART by DR Group",
  "twitter:description": "Premium luxury store",
};

export function generateProductMetaTags(product) {
  const price = (product.priceInPaise / 100).toFixed(2);
  return {
    title: `${product.title} - Buy Online | DR MART`,
    description: product.description?.substring(0, 160) || `Buy ${product.title} at DR MART`,
    keywords: `${product.title}, ${product.category}, buy online`,
    "og:title": product.title,
    "og:description": product.description?.substring(0, 160),
    "og:image": product.image,
    "og:type": "product",
    "og:price:amount": price,
    "og:price:currency": "INR",
    "product:availability": product.stock > 0 ? "in stock" : "out of stock",
    "product:price:amount": price,
    "product:price:currency": "INR",
  };
}

export function SEOComponent({ schema, children }) {
  return (
    <>
      {children}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
    </>
  );
}
