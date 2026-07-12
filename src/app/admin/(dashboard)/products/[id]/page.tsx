import { ProductEditWorkspace } from "@/components/admin/ProductEditWorkspace";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }, { data: batches }] = await Promise.all([
    supabase
      .from("products")
      .select(`*, variants:product_variants(*), images:product_images(*), videos:product_videos(*)`)
      .eq("id", id)
      .single(),
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("product_batches")
      .select("*")
      .eq("product_id", id)
      .order("manufactured_at", { ascending: false }),
  ]);

  if (!product) notFound();

  return (
    <ProductEditWorkspace
      mode="edit"
      product={product}
      categories={categories ?? []}
      batches={batches ?? []}
    />
  );
}
