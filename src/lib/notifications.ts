import { createServiceClient } from "@/lib/supabase/service";
import { sendOrderTemplateEmail } from "@/lib/order-emails";
import { getWhatsAppLink, normalizePakistaniPhone } from "@/lib/utils";
import type { OrderWithItems } from "@/lib/types";

const DEFAULT_ALERT_EMAIL = "orders@safvane.com";

export async function sendOrderNotifications(order: OrderWithItems) {
  const supabase = createServiceClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  const results: {
    adminEmail?: boolean;
    customerEmail?: boolean;
    whatsappUrl?: string;
  } = {};

  const alertEmail =
    settings?.notification_email?.trim() || DEFAULT_ALERT_EMAIL;

  if (order.customer_email?.trim()) {
    const customerResult = await sendOrderTemplateEmail(order, "confirmation", {
      to: order.customer_email,
      bcc: alertEmail,
    });
    if ("success" in customerResult && customerResult.success) {
      results.customerEmail = true;
      results.adminEmail = true;
      await logOrderCommunication(
        order.id,
        "email",
        "confirmation",
        customerResult.recipient
      );
    } else if ("error" in customerResult) {
      console.error("Customer confirmation email failed:", customerResult.error);
    }
  } else {
    // No customer email — send the confirmation copy to the shop inbox only
    const alertResult = await sendOrderTemplateEmail(order, "confirmation", {
      to: alertEmail,
      subject: `[New order] Order Confirmed — ${order.order_number} | Safvane Naturals`,
    });
    if ("success" in alertResult && alertResult.success) {
      results.adminEmail = true;
    }
  }

  if (settings?.notification_whatsapp_number) {
    const waMessage = `New order ${order.order_number}\nCustomer: ${order.customer_name}\nPhone: ${normalizePakistaniPhone(order.customer_phone)}\nTotal: Rs. ${order.total}`;
    results.whatsappUrl = getWhatsAppLink(
      settings.notification_whatsapp_number,
      waMessage
    );
  }

  return results;
}

export async function logOrderCommunication(
  orderId: string,
  channel: "email" | "whatsapp",
  templateId: string,
  recipient?: string
) {
  try {
    const supabase = createServiceClient();
    await supabase.from("order_communications").insert({
      order_id: orderId,
      channel,
      template_id: templateId,
      recipient: recipient ?? null,
      status: "sent",
    });
  } catch (e) {
    console.warn("Could not log order communication:", e);
  }
}
