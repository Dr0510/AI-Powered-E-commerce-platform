CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id text UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text UNIQUE,
  description text,
  price_in_paise integer NOT NULL CHECK (price_in_paise >= 0),
  category text NOT NULL DEFAULT 'General',
  image text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active boolean NOT NULL DEFAULT true,
  tags text[] NOT NULL DEFAULT '{}',
  embedding jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  quantity_on_hand integer NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  reorder_level integer NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
  reserved_quantity integer NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text,
  line1 text NOT NULL,
  city text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  phone text,
  pincode text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  clerk_id text,
  customer_name text,
  customer_email text,
  total_in_paise integer NOT NULL CHECK (total_in_paise >= 0),
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payment_pending', 'paid', 'payment_failed', 'cancelled')),
  fulfillment_status text NOT NULL DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'packed', 'shipped', 'delivered', 'cancelled')),
  stock_adjusted boolean NOT NULL DEFAULT false,
  shipping_name text,
  shipping_line1 text,
  shipping_city text,
  shipping_country text,
  shipping_phone text,
  shipping_pincode text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  title text NOT NULL,
  image text,
  price_in_paise integer NOT NULL CHECK (price_in_paise >= 0),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'razorpay',
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text,
  razorpay_signature text,
  currency text NOT NULL DEFAULT 'INR',
  amount_in_paise integer CHECK (amount_in_paise >= 0),
  status text NOT NULL DEFAULT 'created',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_email_sent_at timestamptz;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_email_status text NOT NULL DEFAULT 'pending';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_email_error text;

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'razorpay',
  event_id text NOT NULL UNIQUE,
  event text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_active_created_idx ON products (active, created_at DESC);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
CREATE INDEX IF NOT EXISTS products_search_idx ON products USING gin (to_tsvector('english', title || ' ' || coalesce(description, '') || ' ' || category));
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);
CREATE INDEX IF NOT EXISTS reviews_product_created_idx ON reviews (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_razorpay_order_idx ON payments (razorpay_order_id);

-- Multi-Vendor Marketplace Tables
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  shop_name text NOT NULL UNIQUE,
  shop_slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  banner_url text,
  category text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  pincode text,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_badge boolean NOT NULL DEFAULT false,
  performance_score decimal(3,2) DEFAULT 0,
  vacation_mode boolean NOT NULL DEFAULT false,
  subscription_plan text DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'pro')),
  commission_rate decimal(5,2) NOT NULL DEFAULT 10,
  total_earnings decimal(15,2) DEFAULT 0,
  followers_count integer DEFAULT 0,
  announcement_banner text,
  full_name text,
  profile_photo_url text,
  business_type text,
  business_description text,
  country text,
  aadhaar_number text,
  pan_number text,
  gst_number text,
  id_upload_url text,
  bank_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  shipping_options text,
  return_policy text,
  store_policies text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sellers ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS business_type text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS business_description text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS aadhaar_number text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS pan_number text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS gst_number text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS id_upload_url text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS bank_details jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS shipping_options text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS return_policy text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS store_policies text;

CREATE TABLE IF NOT EXISTS seller_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  seller_price_in_paise integer NOT NULL CHECK (seller_price_in_paise >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  fulfillment_type text DEFAULT 'seller' CHECK (fulfillment_type IN ('seller', 'platform')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, seller_id)
);

CREATE TABLE IF NOT EXISTS seller_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seller_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('flat', 'percent')),
  discount_value decimal(10,2) NOT NULL,
  min_purchase_in_paise integer DEFAULT 0,
  max_uses integer,
  used_count integer DEFAULT 0,
  expiry_date timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seller_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  amount_in_paise integer NOT NULL CHECK (amount_in_paise >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  bank_account text,
  upi text,
  transaction_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seller_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('seller', 'customer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seller_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, follower_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS sellers_verification_idx ON sellers (verification_status);
CREATE INDEX IF NOT EXISTS sellers_slug_idx ON sellers (shop_slug);
CREATE INDEX IF NOT EXISTS sellers_user_idx ON sellers (user_id);
CREATE INDEX IF NOT EXISTS seller_products_seller_created_idx ON seller_products (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS seller_products_product_seller_idx ON seller_products (product_id, seller_id);
CREATE INDEX IF NOT EXISTS seller_products_active_seller_idx ON seller_products (seller_id) WHERE stock > 0;
CREATE INDEX IF NOT EXISTS seller_reviews_seller_created_idx ON seller_reviews (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS seller_followers_seller_follower_idx ON seller_followers (seller_id, follower_id);
CREATE INDEX IF NOT EXISTS seller_followers_follower_seller_idx ON seller_followers (follower_id, seller_id);
CREATE INDEX IF NOT EXISTS seller_coupons_seller_idx ON seller_coupons (seller_id);
CREATE INDEX IF NOT EXISTS seller_payouts_seller_idx ON seller_payouts (seller_id);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON order_items (product_id);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC);

-- Performance indexes for seller system
CREATE INDEX IF NOT EXISTS orders_status_paid_idx ON orders (status) WHERE status IN ('paid', 'completed', 'delivered');
CREATE INDEX IF NOT EXISTS sellers_slug_verified_idx ON sellers (shop_slug) WHERE verification_status = 'verified';
CREATE INDEX IF NOT EXISTS order_items_order_product_idx ON order_items (order_id, product_id);
CREATE INDEX IF NOT EXISTS seller_products_seller_stock_idx ON seller_products (seller_id, stock) WHERE stock > 0;

-- Checkout System Tables
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'free_shipping')),
  discount_value decimal(10,2) NOT NULL DEFAULT 0,
  min_order_in_paise integer NOT NULL DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  max_uses_per_user integer DEFAULT 1,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coupons_code_active_idx ON coupons (code, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons (code);

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS address_type text DEFAULT 'home';
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_in_paise integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_charge_in_paise integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_in_paise integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'razorpay';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state text;
