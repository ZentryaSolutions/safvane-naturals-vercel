-- Run in Supabase SQL Editor: shipping + promotion settings

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS free_shipping_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS free_shipping_minimum NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS promo_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS promo_headline TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS promo_message TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS promo_ends_at TIMESTAMPTZ;
