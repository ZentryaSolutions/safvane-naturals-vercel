import { ProductEditWorkspace } from "@/components/admin/ProductEditWorkspace";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <ProductEditWorkspace mode="create" categories={categories ?? []} />
  );
}
