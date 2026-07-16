/** Client-side Meta Pixel helpers (browser only). */

const PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "1591811942338255";

export type MetaUserData = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  /** Stable id for matching (e.g. phone or order id) — sent plain; Meta hashes */
  externalId?: string;
};

export type MetaPurchasePayload = {
  value: number;
  currency: "PKR";
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  content_ids: string[];
  content_type: "product";
  num_items: number;
  order_id?: string;
  /** Same ID used by Conversions API for deduplication */
  event_id?: string;
  user?: MetaUserData;
};

export type MetaAddToCartPayload = {
  value: number;
  currency: "PKR";
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  content_ids: string[];
  content_type: "product";
};

export type MetaViewContentPayload = {
  value: number;
  currency: "PKR";
  content_ids: string[];
  content_type: "product";
  content_name: string;
};

export type MetaInitiateCheckoutPayload = {
  value: number;
  currency: "PKR";
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  content_ids: string[];
  content_type: "product";
  num_items: number;
};

export const META_PURCHASE_KEY = "safvane-meta-purchase";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function whenFbqReady(run: () => void, attempts = 40) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq === "function") {
    run();
    return;
  }
  if (attempts <= 0) return;
  window.setTimeout(() => whenFbqReady(run, attempts - 1), 100);
}

/** Pakistan-friendly phone → digits with country code (Meta Advanced Matching). */
export function normalizePhoneForMeta(phone: string) {
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

/**
 * Push customer fields into Pixel Advanced Matching (Meta hashes client-side).
 * Safe to call again before Purchase with filled checkout details.
 */
export function setMetaAdvancedMatching(user: MetaUserData) {
  whenFbqReady(() => {
    if (!PIXEL_ID) return;
    const data: Record<string, string> = {};
    if (user.email?.trim()) data.em = user.email.trim().toLowerCase();
    if (user.phone?.trim()) {
      const ph = normalizePhoneForMeta(user.phone);
      if (ph) data.ph = ph;
    }
    if (user.firstName?.trim()) data.fn = user.firstName.trim().toLowerCase();
    if (user.lastName?.trim()) data.ln = user.lastName.trim().toLowerCase();
    if (user.city?.trim()) data.ct = user.city.trim().toLowerCase();
    data.country = (user.country || "pk").trim().toLowerCase();
    if (user.externalId?.trim()) data.external_id = user.externalId.trim();

    if (Object.keys(data).length <= 1 && !data.em && !data.ph) return;
    window.fbq?.("init", PIXEL_ID, data);
  });
}

/** Fire a standard Meta Pixel event once fbq is available. */
export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string }
) {
  whenFbqReady(() => {
    if (params && options?.eventID) {
      window.fbq?.("track", event, params, { eventID: options.eventID });
    } else if (params) {
      window.fbq?.("track", event, params);
    } else {
      window.fbq?.("track", event);
    }
  });
}

export function trackMetaPurchase(payload: MetaPurchasePayload) {
  if (payload.user) {
    setMetaAdvancedMatching({
      ...payload.user,
      externalId:
        payload.user.externalId ||
        payload.order_id ||
        payload.user.phone ||
        undefined,
    });
  }

  trackMetaEvent(
    "Purchase",
    {
      value: payload.value,
      currency: payload.currency,
      contents: payload.contents,
      content_ids: payload.content_ids,
      content_type: payload.content_type,
      num_items: payload.num_items,
      ...(payload.order_id ? { order_id: payload.order_id } : {}),
    },
    payload.event_id ? { eventID: payload.event_id } : undefined
  );
}

export function trackMetaAddToCart(payload: MetaAddToCartPayload) {
  trackMetaEvent("AddToCart", {
    value: payload.value,
    currency: payload.currency,
    contents: payload.contents,
    content_ids: payload.content_ids,
    content_type: payload.content_type,
  });
}

export function trackMetaViewContent(payload: MetaViewContentPayload) {
  trackMetaEvent("ViewContent", {
    value: payload.value,
    currency: payload.currency,
    content_ids: payload.content_ids,
    content_type: payload.content_type,
    content_name: payload.content_name,
  });
}

export function trackMetaInitiateCheckout(payload: MetaInitiateCheckoutPayload) {
  trackMetaEvent("InitiateCheckout", {
    value: payload.value,
    currency: payload.currency,
    contents: payload.contents,
    content_ids: payload.content_ids,
    content_type: payload.content_type,
    num_items: payload.num_items,
  });
}

export function stashMetaPurchase(payload: MetaPurchasePayload) {
  try {
    sessionStorage.setItem(META_PURCHASE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function consumeMetaPurchase(): MetaPurchasePayload | null {
  try {
    const raw = sessionStorage.getItem(META_PURCHASE_KEY);
    sessionStorage.removeItem(META_PURCHASE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MetaPurchasePayload;
  } catch {
    return null;
  }
}
