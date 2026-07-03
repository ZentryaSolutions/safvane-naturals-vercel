-- Product expenses + inventory restock logs
-- Run in Supabase SQL Editor

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
