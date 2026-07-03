import { createServiceClient } from "@/lib/supabase/service";
import { OrderConfirmationView } from "@/components/storefront/OrderConfirmationView";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select(`*, items:order_items(*)`)
    .eq("order_number", orderNumber)
    .single();

  return <OrderConfirmationView order={order} orderNumber={orderNumber} />;
}
