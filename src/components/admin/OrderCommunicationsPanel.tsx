"use client";

import { useState } from "react";
import {
  Mail,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
} from "lucide-react";
import {
  logWhatsAppTemplateSend,
  sendOrderTemplateEmailAction,
} from "@/app/admin/actions";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import {
  ORDER_TEMPLATES,
  getOrderEmailSubject,
  getOrderEmailText,
  getOrderWhatsAppMessage,
  type OrderTemplateId,
} from "@/lib/order-templates";
import type { Order, OrderItem } from "@/lib/types";
import { getWhatsAppLink, normalizePakistaniPhone } from "@/lib/utils";

interface OrderCommunication {
  id: string;
  channel: string;
  template_id: string;
  recipient: string | null;
  created_at: string;
}

interface OrderCommunicationsPanelProps {
  order: Order & { items: OrderItem[] };
  communications: OrderCommunication[];
}

type PreviewChannel = "email" | "whatsapp";

interface PreviewState {
  channel: PreviewChannel;
  templateId: OrderTemplateId;
  label: string;
  subject: string;
  body: string;
}

function templateLabel(id: string) {
  return ORDER_TEMPLATES.find((t) => t.id === id)?.label ?? id;
}

function formatLogTime(iso: string) {
  return new Date(iso).toLocaleString("en-PK", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  });
}

function orderWithItems(order: Order & { items: OrderItem[] }) {
  return { ...order, items: order.items };
}

export function OrderCommunicationsPanel({
  order,
  communications: initialLog,
}: OrderCommunicationsPanelProps) {
  const { showToast } = useAdminToast();
  const [log, setLog] = useState(initialLog);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [activeTab, setActiveTab] = useState<"templates" | "history">(
    "templates"
  );

  const customerPhone = normalizePakistaniPhone(order.customer_phone);
  const hasEmail = Boolean(order.customer_email?.trim());
  const orderData = orderWithItems(order);

  const buildEmailPreview = (templateId: OrderTemplateId): PreviewState => ({
    channel: "email",
    templateId,
    label: templateLabel(templateId),
    subject: getOrderEmailSubject(templateId, orderData),
    body: getOrderEmailText(templateId, orderData),
  });

  const buildWhatsAppPreview = (templateId: OrderTemplateId): PreviewState => ({
    channel: "whatsapp",
    templateId,
    label: templateLabel(templateId),
    subject: "",
    body: getOrderWhatsAppMessage(templateId, orderData),
  });

  const openEmailPreview = (templateId: OrderTemplateId) => {
    if (!hasEmail) {
      showToast("error", "Add a customer email before sending.");
      return;
    }
    setPreview(buildEmailPreview(templateId));
  };

  const openWhatsAppPreview = (templateId: OrderTemplateId) => {
    setPreview(buildWhatsAppPreview(templateId));
  };

  const resetPreview = () => {
    if (!preview) return;
    setPreview(
      preview.channel === "email"
        ? buildEmailPreview(preview.templateId)
        : buildWhatsAppPreview(preview.templateId)
    );
  };

  const closePreview = () => {
    if (!sending) setPreview(null);
  };

  const confirmSend = async () => {
    if (!preview) return;

    if (preview.channel === "email") {
      if (!preview.subject.trim() || !preview.body.trim()) {
        showToast("error", "Subject and message cannot be empty.");
        return;
      }

      setSending(true);
      const result = await sendOrderTemplateEmailAction(
        order.id,
        preview.templateId,
        { subject: preview.subject, body: preview.body }
      );
      setSending(false);

      if ("error" in result && result.error) {
        showToast("error", result.error);
        return;
      }

      showToast("success", `Email sent to ${result.recipient}`);
      setLog((prev) => [
        {
          id: crypto.randomUUID(),
          channel: "email",
          template_id: preview.templateId,
          recipient: result.recipient ?? order.customer_email,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setPreview(null);
      return;
    }

    if (!preview.body.trim()) {
      showToast("error", "Message cannot be empty.");
      return;
    }

    const url = getWhatsAppLink(customerPhone, preview.body);
    window.open(url, "_blank", "noopener,noreferrer");

    setSending(true);
    await logWhatsAppTemplateSend(
      order.id,
      preview.templateId,
      order.customer_phone
    );
    setSending(false);

    showToast("success", "WhatsApp opened — review and tap Send in the app");
    setLog((prev) => [
      {
        id: crypto.randomUUID(),
        channel: "whatsapp",
        template_id: preview.templateId,
        recipient: order.customer_phone,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setPreview(null);
  };

  return (
    <>
      <section className="admin-card admin-order-section admin-order-comms">
        <div className="admin-order-comms-head">
          <div>
            <h2 className="admin-section-title">Customer communications</h2>
            <p className="admin-field-hint admin-order-comms-sub">
              Review and edit each template before sending. WhatsApp opens a
              chat to <strong>{order.customer_phone}</strong> from{" "}
              <strong>+92 371 2456245</strong>.
            </p>
          </div>
          <div className="admin-order-comms-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "templates"}
              className={activeTab === "templates" ? "on" : ""}
              onClick={() => setActiveTab("templates")}
            >
              Templates
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "history"}
              className={activeTab === "history" ? "on" : ""}
              onClick={() => setActiveTab("history")}
            >
              History {log.length > 0 && `(${log.length})`}
            </button>
          </div>
        </div>

        <div className="admin-order-comms-channels">
          <span className={`admin-comms-pill${hasEmail ? " ok" : " warn"}`}>
            <Mail size={14} />
            {hasEmail ? order.customer_email : "No email on order"}
          </span>
          <span className="admin-comms-pill ok">
            <MessageCircle size={14} />
            WhatsApp: {order.customer_phone}
          </span>
        </div>

        {activeTab === "templates" ? (
          <div className="admin-order-comms-grid">
            {ORDER_TEMPLATES.map((template) => (
              <article key={template.id} className="admin-comms-card">
                <div className="admin-comms-card-top">
                  <h3>{template.label}</h3>
                  <span className="admin-comms-card-cat">{template.category}</span>
                </div>
                <p>{template.description}</p>
                <div className="admin-comms-card-actions">
                  <button
                    type="button"
                    className="admin-comms-btn admin-comms-btn-email"
                    disabled={!hasEmail}
                    onClick={() => openEmailPreview(template.id)}
                    title={
                      hasEmail
                        ? "Review and send email"
                        : "Customer email required"
                    }
                  >
                    <Mail size={15} />
                    Send email
                  </button>
                  <button
                    type="button"
                    className="admin-comms-btn admin-comms-btn-wa"
                    onClick={() => openWhatsAppPreview(template.id)}
                  >
                    <MessageCircle size={15} />
                    Open WhatsApp
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-order-comms-history">
            {log.length === 0 ? (
              <p className="admin-order-comms-empty">
                No messages logged yet. Send a template to start the history.
              </p>
            ) : (
              <ul>
                {log.map((entry) => (
                  <li key={entry.id} className="admin-comms-log-item">
                    <span
                      className={`admin-comms-log-icon ${entry.channel === "email" ? "email" : "wa"}`}
                    >
                      {entry.channel === "email" ? (
                        <Mail size={14} />
                      ) : (
                        <MessageCircle size={14} />
                      )}
                    </span>
                    <div className="admin-comms-log-body">
                      <strong>{templateLabel(entry.template_id)}</strong>
                      <span>
                        {entry.channel === "email" ? "Email" : "WhatsApp"} →{" "}
                        {entry.recipient ?? "—"}
                      </span>
                    </div>
                    <time className="admin-comms-log-time">
                      <Clock size={12} aria-hidden />
                      {formatLogTime(entry.created_at)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="admin-order-comms-footer">
          <CheckCircle2 size={16} aria-hidden />
          <p>
            Order tracking updates will build on this log. Run{" "}
            <code>supabase/order_communications.sql</code> in Supabase if history
            does not persist after refresh.
          </p>
        </div>

        {!hasEmail && (
          <div className="admin-order-comms-alert">
            <AlertCircle size={16} />
            <span>
              Edit the order to add an email address before sending confirmation
              emails.
            </span>
          </div>
        )}
      </section>

      {preview && (
        <div
          className="admin-modal-overlay admin-comms-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="comms-preview-title"
          onClick={closePreview}
        >
          <div
            className="admin-comms-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-comms-preview-head">
              <div className="admin-comms-preview-head-text">
                <p className="admin-comms-preview-eyebrow">
                  {preview.channel === "email" ? (
                    <>
                      <Mail size={14} /> Email preview
                    </>
                  ) : (
                    <>
                      <MessageCircle size={14} /> WhatsApp preview
                    </>
                  )}
                </p>
                <h3 id="comms-preview-title">{preview.label}</h3>
                <p className="admin-comms-preview-recipient">
                  {preview.channel === "email" ? (
                    <>
                      <strong>To:</strong> {order.customer_email}
                    </>
                  ) : (
                    <>
                      <strong>To:</strong> {order.customer_phone}
                      <span className="admin-comms-preview-recipient-note">
                        Edit the message, then open WhatsApp to send
                      </span>
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                className="admin-comms-preview-close"
                onClick={closePreview}
                disabled={sending}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-comms-preview-body admin-form">
              {preview.channel === "email" && (
                <div className="field">
                  <label htmlFor="comms-preview-subject">Subject line</label>
                  <input
                    id="comms-preview-subject"
                    type="text"
                    value={preview.subject}
                    onChange={(e) =>
                      setPreview((p) =>
                        p ? { ...p, subject: e.target.value } : p
                      )
                    }
                    disabled={sending}
                  />
                </div>
              )}

              <div className="field admin-comms-preview-message-field">
                <label htmlFor="comms-preview-body">
                  {preview.channel === "email" ? "Message body" : "WhatsApp message"}
                </label>
                <textarea
                  id="comms-preview-body"
                  value={preview.body}
                  onChange={(e) =>
                    setPreview((p) => (p ? { ...p, body: e.target.value } : p))
                  }
                  disabled={sending}
                  spellCheck
                />
              </div>
            </div>

            <div className="admin-comms-preview-actions">
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={resetPreview}
                disabled={sending}
              >
                <RotateCcw size={15} />
                Reset template
              </button>
              <div className="admin-comms-preview-actions-end">
                <button
                  type="button"
                  className="admin-btn-ghost"
                  onClick={closePreview}
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={
                    preview.channel === "email"
                      ? "admin-btn"
                      : "admin-comms-btn admin-comms-btn-wa admin-comms-preview-send-wa"
                  }
                  onClick={confirmSend}
                  disabled={sending}
                >
                  {sending
                    ? "Sending…"
                    : preview.channel === "email"
                      ? "Send email"
                      : "Open WhatsApp"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
