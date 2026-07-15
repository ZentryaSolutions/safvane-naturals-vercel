import { createHash } from "crypto";

const GRAPH_VERSION = "v21.0";

function getPixelId() {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "1591811942338255";
}

function getAccessToken() {
  return process.env.META_CAPI_ACCESS_TOKEN?.trim() || "";
}

function getTestEventCode() {
  return process.env.META_CAPI_TEST_EVENT_CODE?.trim() || "";
}

type CapContent = {
  id: string;
  quantity: number;
  item_price: number;
};

export type CapPurchaseInput = {
  eventId: string;
  value: number;
  currency?: "PKR";
  contents: CapContent[];
  contentIds: string[];
  numItems: number;
  orderId?: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  country?: string;
  clientIp?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Pakistan-friendly phone normalize → digits with country code, no +. */
function normalizePhone(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) {
    digits = `92${digits.slice(1)}`;
  } else if (digits.length === 10 && digits.startsWith("3")) {
    digits = `92${digits}`;
  }
  return digits;
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function maybeHash(
  value: string | null | undefined,
  normalizer: (v: string) => string
) {
  if (!value?.trim()) return undefined;
  return sha256(normalizer(value));
}

/**
 * Send a Purchase event via Meta Conversions API (server → Meta).
 * Never throws to the caller — logs and returns false on failure.
 */
export async function sendMetaCapiPurchase(
  input: CapPurchaseInput
): Promise<boolean> {
  const accessToken = getAccessToken();
  const pixelId = getPixelId();
  const testEventCode = getTestEventCode();

  if (!accessToken || !pixelId) {
    console.warn("[meta-capi] Missing META_CAPI_ACCESS_TOKEN or pixel id");
    return false;
  }

  const userData: Record<string, unknown> = {
    country: [sha256((input.country || "pk").toLowerCase())],
  };

  const em = maybeHash(input.email, normalizeEmail);
  if (em) userData.em = [em];

  const ph = maybeHash(input.phone, normalizePhone);
  if (ph) userData.ph = [ph];

  const fn = maybeHash(input.firstName, normalizeName);
  if (fn) userData.fn = [fn];

  const ln = maybeHash(input.lastName, normalizeName);
  if (ln) userData.ln = [ln];

  const ct = maybeHash(input.city, (v) => v.trim().toLowerCase());
  if (ct) userData.ct = [ct];

  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  const customData: Record<string, unknown> = {
    value: input.value,
    currency: input.currency || "PKR",
    contents: input.contents.map((c) => ({
      id: c.id,
      quantity: c.quantity,
      item_price: c.item_price,
    })),
    content_ids: input.contentIds,
    content_type: "product",
    num_items: input.numItems,
  };
  if (input.orderId) customData.order_id = input.orderId;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        event_source_url: "https://www.safvane.com/order-confirmation",
        action_source: "website",
        user_data: userData,
        custom_data: customData,
      },
    ],
  };

  // Required for events to appear in Events Manager → Test events
  if (testEventCode) {
    body.test_event_code = testEventCode;
  }

  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      events_received?: number;
    };

    if (!res.ok || json.error) {
      console.error(
        "[meta-capi] Purchase failed:",
        json.error?.message || JSON.stringify(json)
      );
      return false;
    }

    console.info(
      `[meta-capi] Purchase ok events_received=${json.events_received ?? "?"} event_id=${input.eventId}`
    );
    return true;
  } catch (err) {
    console.error("[meta-capi] Purchase request error:", err);
    return false;
  }
}

export function readMetaCookies(cookieHeader: string | null): {
  fbp?: string;
  fbc?: string;
} {
  if (!cookieHeader) return {};
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const map = new Map<string, string>();
  for (const part of parts) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    map.set(part.slice(0, i), decodeURIComponent(part.slice(i + 1)));
  }
  return {
    fbp: map.get("_fbp"),
    fbc: map.get("_fbc"),
  };
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip");
}
