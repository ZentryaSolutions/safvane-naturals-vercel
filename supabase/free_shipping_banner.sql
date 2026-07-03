-- Free shipping storefront banner toggle
-- Run in Supabase SQL Editor

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS free_shipping_show_banner BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE site_settings SET
  free_shipping_enabled = TRUE,
  free_shipping_minimum = 3000,
  free_shipping_show_banner = TRUE
WHERE id = 1;
