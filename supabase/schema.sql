-- Safvane Naturals Ecommerce Schema
-- Run this in Supabase SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE product_status AS ENUM ('active', 'draft', 'hidden');
CREATE TYPE stock_status AS ENUM ('in_stock', 'out_of_stock');
CREATE TYPE order_status AS ENUM ('new', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE content_page_key AS ENUM ('about', 'faq');
CREATE TYPE blog_post_status AS ENUM ('published', 'draft');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  short_description TEXT CHECK (short_description IS NULL OR char_length(short_description) <= 160),
  ingredients TEXT,
  how_to_use TEXT,
  delivery_returns TEXT,
  benefits TEXT[] DEFAULT '{}',
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  status product_status NOT NULL DEFAULT 'draft',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  meta_title TEXT,
  meta_description TEXT,
  use_shop_shipping BOOLEAN NOT NULL DEFAULT TRUE,
  product_free_shipping BOOLEAN NOT NULL DEFAULT FALSE,
  use_shop_promo BOOLEAN NOT NULL DEFAULT TRUE,
  promo_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  promo_headline TEXT,
  promo_message TEXT,
  promo_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product variants
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_label TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  stock_status stock_status NOT NULL DEFAULT 'out_of_stock',
  sku TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product images
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product reviews
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL CHECK (char_length(customer_name) BETWEEN 2 AND 80),
  customer_city TEXT CHECK (customer_city IS NULL OR char_length(customer_city) <= 80),
  customer_email TEXT CHECK (customer_email IS NULL OR char_length(customer_email) <= 120),
  review_title TEXT CHECK (review_title IS NULL OR char_length(review_title) <= 120),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL CHECK (char_length(review_text) BETWEEN 10 AND 2000),
  status review_status NOT NULL DEFAULT 'pending',
  featured_on_homepage BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_review_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_status ON product_reviews(status);
CREATE INDEX idx_product_review_images_review ON product_review_images(review_id);

-- Product batches (manufacturing / expiry tracking)
CREATE TABLE product_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  batch_number TEXT NOT NULL CHECK (char_length(batch_number) BETWEEN 3 AND 40),
  manufactured_at DATE NOT NULL,
  expires_at DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'recalled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, batch_number)
);

CREATE INDEX idx_product_batches_product ON product_batches(product_id);
CREATE INDEX idx_product_batches_variant ON product_batches(variant_id);

-- Order number sequence
CREATE SEQUENCE order_number_seq START 1001;

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT NOT NULL,
  city TEXT NOT NULL,
  order_note TEXT,
  status order_status NOT NULL DEFAULT 'new',
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping_fee NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  tracking_number TEXT,
  courier TEXT DEFAULT 'postex',
  tracking_status TEXT,
  tracking_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  variant_label_snapshot TEXT NOT NULL,
  unit_price_snapshot NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- Content pages
CREATE TABLE content_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_key content_page_key NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Blog posts (Phase 2)
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  status blog_post_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Site settings (single row)
CREATE TABLE site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  flat_shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 200,
  free_shipping_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  free_shipping_minimum NUMERIC(10, 2) NOT NULL DEFAULT 0,
  free_shipping_show_banner BOOLEAN NOT NULL DEFAULT TRUE,
  promo_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  promo_headline TEXT,
  promo_message TEXT,
  promo_ends_at TIMESTAMPTZ,
  notification_email TEXT,
  notification_whatsapp_number TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_address TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Auto-update stock_status from stock_quantity
CREATE OR REPLACE FUNCTION sync_variant_stock_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_quantity <= 0 THEN
    NEW.stock_status := 'out_of_stock';
  ELSIF NEW.stock_status = 'out_of_stock' AND NEW.stock_quantity > 0 THEN
    NEW.stock_status := 'in_stock';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_variant_stock
  BEFORE INSERT OR UPDATE OF stock_quantity ON product_variants
  FOR EACH ROW EXECUTE FUNCTION sync_variant_stock_status();

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'SFV-' || nextval('order_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_variants_updated BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_site_settings_updated BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;

-- Public read policies (storefront)
CREATE POLICY "Public read active categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read active products" ON products FOR SELECT USING (status = 'active');
CREATE POLICY "Public read variants of active products" ON product_variants FOR SELECT
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.status = 'active'));
CREATE POLICY "Public read images of active products" ON product_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.status = 'active'));
CREATE POLICY "Public read content pages" ON content_pages FOR SELECT USING (true);
CREATE POLICY "Public read published blog" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public read site settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public read approved reviews" ON product_reviews FOR SELECT
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND p.status = 'active'
    )
  );
CREATE POLICY "Public insert pending reviews" ON product_reviews FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND p.status = 'active'
    )
  );
CREATE POLICY "Public read approved review images" ON product_review_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_reviews r
      JOIN products p ON p.id = r.product_id
      WHERE r.id = review_id AND r.status = 'approved' AND p.status = 'active'
    )
  );

-- Admin full access (authenticated users)
CREATE POLICY "Admin all categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all variants" ON product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all images" ON product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all order items" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all content" ON content_pages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all blog" ON blog_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all settings" ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all reviews" ON product_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all review images" ON product_review_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin all product batches" ON product_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Product expenses + inventory restock logs
CREATE TABLE IF NOT EXISTS product_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  category TEXT NOT NULL CHECK (
    category IN ('raw_materials', 'packaging', 'shipping', 'marketing', 'labour', 'other')
  ),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_expenses_product ON product_expenses(product_id);
CREATE INDEX IF NOT EXISTS idx_product_expenses_date ON product_expenses(expense_date DESC);

CREATE TABLE IF NOT EXISTS inventory_restock_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_added INTEGER NOT NULL CHECK (quantity_added > 0),
  previous_quantity INTEGER NOT NULL CHECK (previous_quantity >= 0),
  new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
  cost_per_unit NUMERIC(10, 2) CHECK (cost_per_unit IS NULL OR cost_per_unit >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_restock_variant ON inventory_restock_logs(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_restock_product ON inventory_restock_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_restock_created ON inventory_restock_logs(created_at DESC);

ALTER TABLE product_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_restock_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access product_expenses"
  ON product_expenses FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access inventory_restock_logs"
  ON inventory_restock_logs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Service role can insert orders (via API)
CREATE POLICY "Service insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert order items" ON order_items FOR INSERT WITH CHECK (true);

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Public read product images storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admin upload product images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Admin update product images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Admin delete product images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images');

INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Public read review images storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-images');
CREATE POLICY "Service upload review images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'review-images');
CREATE POLICY "Service delete review images" ON storage.objects
  FOR DELETE USING (bucket_id = 'review-images');

-- Seed data
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Black Seed Oil', 'black-seed-oil', 'Premium cold-pressed kalonji oil', 1)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO content_pages (page_key, content) VALUES
  ('about', '# About Safvane Naturals Pvt. Ltd.

Safvane Naturals Pvt. Ltd. (CUIN 0343184) is a Pakistan-based wellness company headquartered in Attock. We craft cold-pressed, chemical-free natural oils — starting with our signature black seed oil and growing into a full range of pure botanical products.

Our promise is simple: label transparency, small-batch quality, and nationwide delivery with cash on delivery. Every bottle is made for families across Pakistan who want natural wellness they can trust.

*Edit this content from the admin panel.*'),
  ('faq', '# Frequently Asked Questions

## Delivery Timeline
Orders are typically delivered within 3-5 business days across major cities in Pakistan.

## COD Process
We accept Cash on Delivery only. Our team will contact you to confirm your order before dispatch.

## Returns & Refunds
Contact us within 7 days of delivery for any quality concerns.

## How to Use
Take 1 teaspoon daily, or as directed by your healthcare provider.

## Shelf Life & Storage
Store in a cool, dry place away from direct sunlight. Best before 24 months from manufacturing.

*Edit this content from the admin panel.*')
ON CONFLICT (page_key) DO NOTHING;

UPDATE site_settings SET
  flat_shipping_fee = 200,
  free_shipping_enabled = TRUE,
  free_shipping_minimum = 3000,
  free_shipping_show_banner = TRUE,
  notification_email = 'orders@safvane.com',
  notification_whatsapp_number = '923712456245',
  contact_phone = '+92 371 2456245',
  contact_email = 'info@safvane.com',
  contact_address = 'Attock City, Pakistan'
WHERE id = 1;
