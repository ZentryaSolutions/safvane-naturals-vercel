import { createClient } from "@/lib/supabase/server";
import { OrderDetailClient } from "@/components/admin/OrderDetailClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(`*, items:order_items(*)`)
    .eq("id", id)
    .single();

  if (!order) notFound();

  return <OrderDetailClient order={order} />;
}
