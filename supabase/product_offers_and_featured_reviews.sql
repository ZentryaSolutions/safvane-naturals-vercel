-- Per-product shipping/promo overrides + homepage featured reviews
-- Run in Supabase SQL Editor

ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS featured_on_homepage BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_product_reviews_featured
  ON product_reviews(featured_on_homepage)
  WHERE featured_on_homepage = TRUE AND status = 'approved';

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS use_shop_shipping BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS product_free_shipping BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS use_shop_promo BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS promo_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS promo_headline TEXT,
  ADD COLUMN IF NOT EXISTS promo_message TEXT,
  ADD COLUMN IF NOT EXISTS promo_ends_at TIMESTAMPTZ;

UPDATE site_settings SET
  notification_whatsapp_number = '923712456245',
  contact_phone = '+92 371 2456245',
  contact_email = 'info@safvane.com',
  contact_address = 'Attock City, Pakistan'
WHERE id = 1;
