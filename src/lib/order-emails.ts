import { Resend } from "resend";
import {
  extractCustomEmailIntro,
  getOrderEmailHtml,
  getOrderEmailSubject,
  getOrderEmailText,
  isOrderEmailCustomized,
  type OrderTemplateId,
} from "@/lib/order-templates";
import type { OrderWithItems } from "@/lib/types";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export function isEmailConfigured() {
  return Boolean(resend && process.env.RESEND_FROM_EMAIL);
}

export async function sendOrderTemplateEmail(
  order: OrderWithItems,
  templateId: OrderTemplateId,
  options?: {
    to?: string;
    subject?: string;
    text?: string;
    bcc?: string | string[];
  }
) {
  const recipient = options?.to?.trim() || order.customer_email?.trim();
  if (!recipient) {
    return { error: "No customer email on this order." };
  }

  if (!resend) {
    return {
      error:
        "Email is not configured. Add RESEND_API_KEY to your environment variables.",
    };
  }

  const from =
    process.env.RESEND_FROM_EMAIL ?? "orders@safvane.com";

  const defaultSubject = getOrderEmailSubject(templateId, order);
  const defaultText = getOrderEmailText(templateId, order);
  const subject = options?.subject?.trim() || defaultSubject;
  const text = options?.text?.trim() || defaultText;
  const customized = isOrderEmailCustomized(templateId, order, options);

  const html = customized
    ? getOrderEmailHtml(templateId, order, {
        introOverride: extractCustomEmailIntro(text, order.customer_name),
      })
    : getOrderEmailHtml(templateId, order);

  const bccList = normalizeBcc(options?.bcc, recipient);

  try {
    await resend.emails.send({
      from: `Safvane Naturals <${from}>`,
      to: recipient,
      ...(bccList.length > 0 ? { bcc: bccList } : {}),
      subject,
      text,
      html,
    });
    return { success: true as const, recipient };
  } catch (e) {
    console.error("Order email failed:", e);
    return {
      error:
        e instanceof Error ? e.message : "Failed to send email. Try again.",
    };
  }
}

function normalizeBcc(
  bcc: string | string[] | undefined,
  to: string
): string[] {
  if (!bcc) return [];
  const toLower = to.trim().toLowerCase();
  const list = (Array.isArray(bcc) ? bcc : [bcc])
    .map((e) => e.trim())
    .filter(Boolean);
  return [...new Set(list)].filter((e) => e.toLowerCase() !== toLower);
}
