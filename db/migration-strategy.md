# MongoDB to Neon PostgreSQL Migration Strategy

## Current Collections

- `users`: Clerk-linked customer and admin records.
- `products`: catalog records with images, tags, stock, and optional AI embeddings.
- `orders`: customer orders with embedded order items, shipping address, and payment metadata.
- `reviews`: product reviews linked to users and products.
- `webhookevents`: Razorpay webhook idempotency records.

## Target PostgreSQL Model

The Neon schema normalizes shared entities into relational tables:

- `users`
- `categories`
- `products`
- `inventory`
- `addresses`
- `carts`
- `wishlists`
- `orders`
- `order_items`
- `payments`
- `reviews`
- `webhook_events`

Product images and AI embeddings remain JSON-compatible fields because they are document-like metadata. Orders are normalized into `orders`, `order_items`, and `payments` for reliable reporting, payment auditing, and inventory operations.

## Cutover Steps

1. Create a Neon project and copy the pooled connection string.
2. Set `DATABASE_URL` in local and deployment environments.
3. Run `db/schema.sql` against Neon.
4. Export MongoDB collections as JSON.
5. Import users first, preserving `clerkId` as `clerk_id`.
6. Import categories from distinct product categories.
7. Import products with `priceInPaise` mapped to `price_in_paise`; copy `images`, `tags`, and `embedding`.
8. Import orders, then order items, then payments.
9. Import reviews and webhook events.
10. Run reconciliation checks:
    - product count
    - user count
    - paid revenue total
    - order item totals equal order totals
    - no orphaned reviews, order items, or payments
11. Deploy the PostgreSQL-backed application.
12. Keep the MongoDB backup read-only until the first successful production order, then archive it.
