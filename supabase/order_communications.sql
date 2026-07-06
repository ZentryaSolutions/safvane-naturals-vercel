-- Order communication log (email + WhatsApp template sends)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS order_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  template_id TEXT NOT NULL,
  recipient TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_communications_order_id
  ON order_communications(order_id);

CREATE INDEX IF NOT EXISTS idx_order_communications_created_at
  ON order_communications(created_at DESC);

ALTER TABLE order_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage order communications"
  ON order_communications FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
