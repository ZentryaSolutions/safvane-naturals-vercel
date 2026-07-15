/** Client-side Meta Pixel helpers (browser only). */

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

/** Fire a standard Meta Pixel event once fbq is available. */
export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>
) {
  whenFbqReady(() => {
    if (params) window.fbq?.("track", event, params);
    else window.fbq?.("track", event);
  });
}

export function trackMetaPurchase(payload: MetaPurchasePayload) {
  trackMetaEvent("Purchase", {
    value: payload.value,
    currency: payload.currency,
    contents: payload.contents,
    content_ids: payload.content_ids,
    content_type: payload.content_type,
    num_items: payload.num_items,
    ...(payload.order_id ? { order_id: payload.order_id } : {}),
  });
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
