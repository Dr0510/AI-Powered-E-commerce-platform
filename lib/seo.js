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
      name: "DR Mart",
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
    name: "DR Mart",
    url: "https://drmart.example.com",
    logo: "https://drmart.example.com/logo.png",
    description: "Your ultimate electronics marketplace",
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
  title: "DR Mart - Premium Electronics Store",
  description: "Shop quality electronics with fast delivery and best prices",
  keywords: "electronics, online store, gadgets, mobile, laptops",
  author: "DR Mart",
  "og:title": "DR Mart - Premium Electronics Store",
  "og:description": "Shop quality electronics with fast delivery",
  "og:type": "website",
  "og:image": "https://drmart.example.com/og-image.png",
  "twitter:card": "summary_large_image",
  "twitter:title": "DR Mart",
  "twitter:description": "Premium electronics store",
};

export function generateProductMetaTags(product) {
  const price = (product.priceInPaise / 100).toFixed(2);
  return {
    title: `${product.title} - Buy Online | DR Mart`,
    description: product.description?.substring(0, 160) || `Buy ${product.title} at DR Mart`,
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
