-- Product videos + storage (run in Supabase SQL Editor if MCP migration not applied)

CREATE TABLE IF NOT EXISTS product_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  poster_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_videos_product ON product_videos(product_id);

ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read videos of active products" ON product_videos;
CREATE POLICY "Public read videos of active products" ON product_videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_videos.product_id
        AND p.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Admin all product videos" ON product_videos;
CREATE POLICY "Admin all product videos" ON product_videos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-videos',
  'product-videos',
  true,
  104857600,
  ARRAY['video/mp4','video/webm','video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read product videos storage" ON storage.objects;
CREATE POLICY "Public read product videos storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Admin upload product videos" ON storage.objects;
CREATE POLICY "Admin upload product videos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Admin update product videos" ON storage.objects;
CREATE POLICY "Admin update product videos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Admin delete product videos" ON storage.objects;
CREATE POLICY "Admin delete product videos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-videos');
