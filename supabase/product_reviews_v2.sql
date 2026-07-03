-- Run in Supabase SQL Editor to upgrade reviews (images + title + email)

DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL CHECK (char_length(customer_name) BETWEEN 2 AND 80),
  customer_city TEXT CHECK (customer_city IS NULL OR char_length(customer_city) <= 80),
  customer_email TEXT CHECK (customer_email IS NULL OR char_length(customer_email) <= 120),
  review_title TEXT CHECK (review_title IS NULL OR char_length(review_title) <= 120),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL CHECK (char_length(review_text) BETWEEN 10 AND 2000),
  status review_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS review_title TEXT;

CREATE TABLE IF NOT EXISTS product_review_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_review_images_review ON product_review_images(review_id);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_review_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read approved reviews" ON product_reviews;
CREATE POLICY "Public read approved reviews" ON product_reviews FOR SELECT
  USING (
    status = 'approved'
    AND EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.status = 'active')
  );

DROP POLICY IF EXISTS "Public insert pending reviews" ON product_reviews;
CREATE POLICY "Public insert pending reviews" ON product_reviews FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.status = 'active')
  );

DROP POLICY IF EXISTS "Admin all reviews" ON product_reviews;
CREATE POLICY "Admin all reviews" ON product_reviews FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read approved review images" ON product_review_images;
CREATE POLICY "Public read approved review images" ON product_review_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_reviews r
      JOIN products p ON p.id = r.product_id
      WHERE r.id = review_id AND r.status = 'approved' AND p.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Admin all review images" ON product_review_images;
CREATE POLICY "Admin all review images" ON product_review_images FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Public read review images storage" ON storage.objects;
CREATE POLICY "Public read review images storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-images');

DROP POLICY IF EXISTS "Service upload review images" ON storage.objects;
CREATE POLICY "Service upload review images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'review-images');

DROP POLICY IF EXISTS "Service delete review images" ON storage.objects;
CREATE POLICY "Service delete review images" ON storage.objects
  FOR DELETE USING (bucket_id = 'review-images');
