-- Add editable Delivery & Returns tab content per product
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_returns TEXT;
