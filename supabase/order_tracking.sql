-- Order tracking fields (PostEx)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS courier TEXT DEFAULT 'postex',
  ADD COLUMN IF NOT EXISTS tracking_status TEXT,
  ADD COLUMN IF NOT EXISTS tracking_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS orders_tracking_number_idx
  ON public.orders (tracking_number)
  WHERE tracking_number IS NOT NULL;
