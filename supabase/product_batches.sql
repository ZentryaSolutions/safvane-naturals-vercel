-- Product batches + variant barcode (SKU) support
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS product_batches (
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

CREATE INDEX IF NOT EXISTS idx_product_batches_product ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_variant ON product_batches(variant_id);

ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all product batches" ON product_batches;
CREATE POLICY "Admin all product batches" ON product_batches FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- SKU on variants is used as the scannable barcode value (Code 128)
COMMENT ON COLUMN product_variants.sku IS 'Internal SKU encoded in barcode — scanners read this as text for inventory lookup';
