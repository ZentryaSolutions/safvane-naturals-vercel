"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/admin/actions";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import type { SiteSettings } from "@/lib/types";

function toDatetimeLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SettingsForm({ settings }: { settings: SiteSettings | null }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const result = await saveSettings(form);
    setSaving(false);
    if (result.error) {
      showToast("error", result.error);
      return;
    }
    showToast("success", "Settings saved successfully");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: 640 }}>
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <h2 className="admin-section-title">Shipping</h2>
        <p className="admin-field-hint" style={{ marginBottom: 16 }}>
          Default shipping for the whole shop. Override per product under Products → Shipping &amp; promos.
        </p>

        <div className="field">
          <label htmlFor="flat_shipping_fee">Standard shipping fee (PKR)</label>
          <input
            id="flat_shipping_fee"
            name="flat_shipping_fee"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={settings?.flat_shipping_fee ?? 200}
          />
        </div>

        <label className="admin-checkbox-row">
          <input
            type="checkbox"
            name="free_shipping_enabled"
            defaultChecked={settings?.free_shipping_enabled}
          />
          <span>Enable free shipping on orders over a minimum amount</span>
        </label>

        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="free_shipping_minimum">Minimum order for free shipping (PKR)</label>
          <input
            id="free_shipping_minimum"
            name="free_shipping_minimum"
            type="number"
            min={0}
            step={1}
            defaultValue={settings?.free_shipping_minimum ?? 3000}
          />
          <p className="admin-field-hint">
            e.g. 3000 — customers see &ldquo;Free shipping on all orders over 3,000
            PKR!&rdquo; Set to 0 for free shipping on every order.
          </p>
        </div>

        <label className="admin-checkbox-row" style={{ marginTop: 16 }}>
          <input
            type="checkbox"
            name="free_shipping_show_banner"
            defaultChecked={settings?.free_shipping_show_banner ?? true}
          />
          <span>Show free shipping banner on storefront</span>
        </label>
        <p className="admin-field-hint" style={{ marginTop: 8 }}>
          Displays at the top of every page when no custom promotion banner is active.
          Checkout also shows how much more is needed for free shipping.
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: 24 }}>
        <h2 className="admin-section-title">Promotions & countdown</h2>
        <p className="admin-field-hint" style={{ marginBottom: 16 }}>
          Show a banner on the storefront with your deal message and optional countdown timer.
        </p>

        <label className="admin-checkbox-row">
          <input type="checkbox" name="promo_enabled" defaultChecked={settings?.promo_enabled} />
          <span>Show promotion banner on storefront</span>
        </label>

        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="promo_headline">Headline</label>
          <input
            id="promo_headline"
            name="promo_headline"
            placeholder="e.g. Weekend Flash Sale"
            defaultValue={settings?.promo_headline ?? ""}
          />
        </div>

        <div className="field">
          <label htmlFor="promo_message">Message</label>
          <input
            id="promo_message"
            name="promo_message"
            placeholder="e.g. Free shipping + 10% off — limited time"
            defaultValue={settings?.promo_message ?? ""}
          />
        </div>

        <div className="field">
          <label htmlFor="promo_ends_at">Countdown ends (optional)</label>
          <input
            id="promo_ends_at"
            name="promo_ends_at"
            type="datetime-local"
            defaultValue={toDatetimeLocal(settings?.promo_ends_at)}
          />
          <p className="admin-field-hint">Leave empty for a banner without a timer.</p>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 24 }}>
        <h2 className="admin-section-title">Order notifications</h2>

        <div className="field">
          <label htmlFor="notification_email">Order alert email (BCC)</label>
          <input
            id="notification_email"
            name="notification_email"
            type="email"
            placeholder="orders@safvane.com"
            defaultValue={settings?.notification_email ?? "orders@safvane.com"}
          />
          <p className="admin-field-hint">
            BCC copy of every order confirmation sent here (default:
            orders@safvane.com). Customer still receives the branded email only
            once.
          </p>
        </div>

        <div className="field">
          <label htmlFor="notification_whatsapp_number">Order notification WhatsApp</label>
          <input
            id="notification_whatsapp_number"
            name="notification_whatsapp_number"
            placeholder="923712456245"
            defaultValue={settings?.notification_whatsapp_number ?? ""}
          />
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 24 }}>
        <h2 className="admin-section-title">Contact page</h2>

        <div className="field">
          <label htmlFor="contact_phone">Phone</label>
          <input id="contact_phone" name="contact_phone" defaultValue={settings?.contact_phone ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="contact_email">Email</label>
          <input id="contact_email" name="contact_email" type="email" defaultValue={settings?.contact_email ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="contact_address">Address</label>
          <textarea id="contact_address" name="contact_address" rows={2} defaultValue={settings?.contact_address ?? ""} />
        </div>
      </div>

      <button type="submit" className="admin-btn" disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
