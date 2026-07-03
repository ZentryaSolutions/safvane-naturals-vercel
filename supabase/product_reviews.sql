-- Product reviews (run in Supabase SQL Editor if not using full schema.sql)

CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL CHECK (char_length(customer_name) BETWEEN 2 AND 80),
  customer_city TEXT CHECK (customer_city IS NULL OR char_length(customer_city) <= 80),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL CHECK (char_length(review_text) BETWEEN 10 AND 2000),
  status review_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read approved reviews" ON product_reviews;
CREATE POLICY "Public read approved reviews" ON product_reviews FOR SELECT
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND p.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Public insert pending reviews" ON product_reviews;
CREATE POLICY "Public insert pending reviews" ON product_reviews FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND p.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Admin all reviews" ON product_reviews;
CREATE POLICY "Admin all reviews" ON product_reviews FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
