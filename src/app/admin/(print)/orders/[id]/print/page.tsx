import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { InvoicePrintPageClient } from "@/components/admin/InvoicePrintPageClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("order_number")
    .eq("id", id)
    .single();

  return {
    title: order ? `${order.order_number} — Invoice` : "Invoice",
    robots: { index: false, follow: false },
  };
}

export default async function OrderInvoicePrintPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(`*, items:order_items(*)`)
    .eq("id", id)
    .single();

  if (!order) notFound();

  return <InvoicePrintPageClient order={order} />;
}
