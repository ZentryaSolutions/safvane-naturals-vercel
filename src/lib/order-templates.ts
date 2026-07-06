import { CONTACT, WEBSITE_URL } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import type { OrderItem, OrderWithItems } from "@/lib/types";

export type OrderTemplateId =
  | "confirmation"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "address_confirm"
  | "payment_reminder";

export interface OrderTemplateMeta {
  id: OrderTemplateId;
  label: string;
  description: string;
  category: "status" | "support";
}

export const ORDER_TEMPLATES: OrderTemplateMeta[] = [
  {
    id: "confirmation",
    label: "Order Confirmed",
    description: "Thank the customer and share order summary",
    category: "status",
  },
  {
    id: "processing",
    label: "Being Prepared",
    description: "Order is being packed",
    category: "status",
  },
  {
    id: "shipped",
    label: "Shipped",
    description: "Parcel has been dispatched",
    category: "status",
  },
  {
    id: "out_for_delivery",
    label: "Out for Delivery",
    description: "Courier is on the way today",
    category: "status",
  },
  {
    id: "delivered",
    label: "Delivered",
    description: "Confirm successful delivery",
    category: "status",
  },
  {
    id: "cancelled",
    label: "Order Cancelled",
    description: "Notify about cancellation",
    category: "status",
  },
  {
    id: "address_confirm",
    label: "Confirm Address",
    description: "Verify delivery details before dispatch",
    category: "support",
  },
  {
    id: "payment_reminder",
    label: "COD Reminder",
    description: "Remind customer to keep cash ready",
    category: "support",
  },
];

function itemsSummary(items: OrderItem[]) {
  return items
    .map(
      (i) =>
        `• ${i.product_name_snapshot} (${i.variant_label_snapshot}) × ${i.quantity} — ${formatPrice(i.unit_price_snapshot * i.quantity)}`
    )
    .join("\n");
}

function itemsHtml(items: OrderItem[]) {
  return items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #2a2820;color:#e8e4dc;">${i.product_name_snapshot}<br><span style="font-size:12px;color:#9a9588;">${i.variant_label_snapshot} × ${i.quantity}</span></td>
          <td style="padding:8px 0;border-bottom:1px solid #2a2820;color:#e8e4dc;text-align:right;">${formatPrice(i.unit_price_snapshot * i.quantity)}</td>
        </tr>`
    )
    .join("");
}

export function getOrderEmailSubject(
  templateId: OrderTemplateId,
  order: OrderWithItems
) {
  const subjects: Record<OrderTemplateId, string> = {
    confirmation: `Order Confirmed — ${order.order_number} | Safvane Naturals`,
    processing: `Your order is being prepared — ${order.order_number}`,
    shipped: `Your order has shipped — ${order.order_number}`,
    out_for_delivery: `Out for delivery today — ${order.order_number}`,
    delivered: `Order delivered — ${order.order_number} | Safvane Naturals`,
    cancelled: `Order cancelled — ${order.order_number}`,
    address_confirm: `Please confirm your delivery address — ${order.order_number}`,
    payment_reminder: `COD payment reminder — ${order.order_number}`,
  };
  return subjects[templateId];
}

export function getOrderEmailText(
  templateId: OrderTemplateId,
  order: OrderWithItems
) {
  const name = order.customer_name.split(" ")[0];
  const lines = itemsSummary(order.items);
  const total = formatPrice(Number(order.total));
  const address = `${order.delivery_address}, ${order.city}, Pakistan`;

  const intros: Record<OrderTemplateId, string> = {
    confirmation: `Hi ${name},\n\nThank you for your order with Safvane Naturals! We've received your order and our team will prepare it shortly.`,
    processing: `Hi ${name},\n\nGood news — your order ${order.order_number} is now being prepared and packed with care.`,
    shipped: `Hi ${name},\n\nYour Safvane Naturals order ${order.order_number} has been shipped and is on its way to you.`,
    out_for_delivery: `Hi ${name},\n\nYour order ${order.order_number} is out for delivery today. Please keep your phone available.`,
    delivered: `Hi ${name},\n\nYour order ${order.order_number} has been delivered. We hope you love your Safvane Naturals products!`,
    cancelled: `Hi ${name},\n\nYour order ${order.order_number} has been cancelled as requested. If this was a mistake, reply to this email or WhatsApp us.`,
    address_confirm: `Hi ${name},\n\nBefore we dispatch order ${order.order_number}, please confirm your delivery address is correct:`,
    payment_reminder: `Hi ${name},\n\nA quick reminder for your Cash on Delivery order ${order.order_number}:`,
  };

  return `${intros[templateId]}

Order: ${order.order_number}
${lines}

Subtotal: ${formatPrice(Number(order.subtotal))}
Shipping: ${Number(order.shipping_fee) === 0 ? "FREE" : formatPrice(Number(order.shipping_fee))}
Total (COD): ${total}

Delivery address:
${address}
${order.order_note ? `\nYour note: ${order.order_note}` : ""}

Questions? WhatsApp ${CONTACT.phoneDisplay} or email ${CONTACT.email}

— Safvane Naturals
${WEBSITE_URL}`.trim();
}

export function getOrderEmailHtml(
  templateId: OrderTemplateId,
  order: OrderWithItems,
  opts?: { introOverride?: string; headlineOverride?: string }
) {
  const name = order.customer_name.split(" ")[0];
  const subject = getOrderEmailSubject(templateId, order);
  const text = getOrderEmailText(templateId, order);
  const address = `${order.delivery_address}, ${order.city}, Pakistan`;

  const headline: Record<OrderTemplateId, string> = {
    confirmation: "Order confirmed",
    processing: "We're preparing your order",
    shipped: "Your order is on the way",
    out_for_delivery: "Out for delivery today",
    delivered: "Delivered successfully",
    cancelled: "Order cancelled",
    address_confirm: "Confirm your address",
    payment_reminder: "COD payment reminder",
  };

  const defaultIntro =
    text.split("\n\n")[0].replace(`Hi ${name},`, "").trim() ||
    "Thank you for shopping with Safvane Naturals.";
  const intro = opts?.introOverride?.trim() || defaultIntro;
  const displayHeadline = opts?.headlineOverride?.trim() || headline[templateId];

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0908;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0908;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#12100d;border:1px solid #2a2820;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px 28px 20px;border-bottom:1px solid #2a2820;">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#c9a227;">Safvane Naturals</p>
          <h1 style="margin:0;font-size:24px;font-weight:400;color:#f5f0e6;">${displayHeadline}</h1>
        </td></tr>
        <tr><td style="padding:24px 28px;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.65;color:#c8c2b8;">
          <p style="margin:0 0 16px;color:#e8e4dc;">Hi ${name},</p>
          <p style="margin:0 0 20px;">${escapeHtml(intro)}</p>
          <div style="background:#1a1814;border:1px solid #2a2820;border-radius:8px;padding:16px 18px;margin-bottom:20px;">
            <p style="margin:0 0 12px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#c9a227;">Order ${order.order_number}</p>
            <table width="100%" cellpadding="0" cellspacing="0">${itemsHtml(order.items)}</table>
            <p style="margin:16px 0 0;padding-top:12px;border-top:1px solid #2a2820;color:#f5f0e6;font-size:16px;text-align:right;">
              Total (COD): <strong style="color:#e8d48a;">${formatPrice(Number(order.total))}</strong>
            </p>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#9a9588;">Delivery address</p>
          <p style="margin:0 0 20px;color:#e8e4dc;">${address}</p>
          ${templateId === "payment_reminder" ? `<p style="margin:0 0 20px;padding:12px 14px;background:rgba(201,162,39,.1);border:1px solid rgba(201,162,39,.25);border-radius:8px;color:#e8d48a;">Please keep <strong>${formatPrice(Number(order.total))}</strong> ready for cash on delivery.</p>` : ""}
          <p style="margin:0;font-size:13px;color:#9a9588;">Questions? WhatsApp <a href="https://wa.me/${CONTACT.whatsapp}" style="color:#c9a227;">${CONTACT.phoneDisplay}</a></p>
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid #2a2820;font-family:system-ui,sans-serif;font-size:11px;color:#6b665c;text-align:center;">
          ${CONTACT.company} · ${WEBSITE_URL}<br>
          <span style="color:#4a4740;">${subject}</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function extractCustomEmailIntro(text: string, customerName: string) {
  const stripped = text
    .replace(new RegExp(`^Hi\\s+${customerName.split(" ")[0]}[,!]?\\s*`, "i"), "")
    .trim();
  const beforeOrder = stripped.split(/\n\nOrder:/i)[0].trim();
  const firstBlock = beforeOrder.split(/\n\n/)[0]?.trim();
  return firstBlock || "Thank you for shopping with Safvane Naturals.";
}

export function isOrderEmailCustomized(
  templateId: OrderTemplateId,
  order: OrderWithItems,
  options?: { subject?: string; text?: string }
) {
  const norm = (s: string) => s.replace(/\r\n/g, "\n").trim();
  if (
    options?.subject &&
    norm(options.subject) !== norm(getOrderEmailSubject(templateId, order))
  ) {
    return true;
  }
  if (
    options?.text &&
    norm(options.text) !== norm(getOrderEmailText(templateId, order))
  ) {
    return true;
  }
  return false;
}

export function getOrderWhatsAppMessage(
  templateId: OrderTemplateId,
  order: OrderWithItems
) {
  const name = order.customer_name.split(" ")[0];
  const total = formatPrice(Number(order.total));
  const address = `${order.delivery_address}, ${order.city}`;

  const messages: Record<OrderTemplateId, string> = {
    confirmation: `Assalam o Alaikum ${name}! 🌿

Thank you for ordering from *Safvane Naturals*.

*Order:* ${order.order_number}
*Total (COD):* ${total}
*Address:* ${address}

We're preparing your order. You'll receive updates as it moves along.

— Safvane Naturals
${WEBSITE_URL}`,
    processing: `Hi ${name}! Your Safvane Naturals order *${order.order_number}* is now being prepared and packed. We'll notify you when it ships. 🌿`,
    shipped: `Hi ${name}! Great news — your order *${order.order_number}* has been shipped and is on its way to you. 📦

Total (COD): ${total}
Address: ${address}`,
    out_for_delivery: `Hi ${name}! Your order *${order.order_number}* is *out for delivery today*. Please keep your phone available and ${total} ready for COD. 🚚`,
    delivered: `Hi ${name}! Your order *${order.order_number}* has been delivered. Thank you for choosing Safvane Naturals! 🌿

We'd love your feedback — reply here anytime.`,
    cancelled: `Hi ${name}, your Safvane Naturals order *${order.order_number}* has been cancelled. If this was a mistake, please reply and we'll help.`,
    address_confirm: `Hi ${name}! Before we ship order *${order.order_number}*, please confirm your delivery address:

${address}

Reply YES if correct, or send the updated address. Thank you!`,
    payment_reminder: `Hi ${name}! Reminder for your COD order *${order.order_number}*:

Please keep *${total}* ready when the courier arrives.

Thank you! — Safvane Naturals`,
  };

  return messages[templateId];
}
