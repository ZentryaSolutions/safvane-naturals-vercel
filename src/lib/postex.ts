/**
 * PostEx COD Integration — Order Tracking only.
 * Docs: track-order GET with `token` header.
 */

const POSTEX_TRACK_URL =
  "https://api.postex.pk/services/integration/api/order/v1/track-order";

export interface PostExStatusHistoryItem {
  transactionStatusMessage: string;
  transactionStatusMessageCode?: string;
  transactionStatusDateTime?: string;
}

export interface PostExTrackDist {
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  invoicePayment?: number;
  orderDetail?: string;
  orderPickupDate?: string;
  orderDeliveryDate?: string;
  orderRefNumber?: string;
  trackingNumber?: string;
  transactionDate?: string;
  merchantName?: string;
  transactionStatus?: string;
  cityName?: string;
  transactionNotes?: string;
  transactionStatusHistory?: PostExStatusHistoryItem[];
}

export interface PostExTrackResult {
  ok: true;
  status: string;
  trackingNumber: string;
  orderRefNumber: string | null;
  cityName: string | null;
  orderPickupDate: string | null;
  orderDeliveryDate: string | null;
  history: Array<{
    message: string;
    code?: string;
    at?: string;
  }>;
  raw: PostExTrackDist;
}

export interface PostExTrackError {
  ok: false;
  error: string;
  statusCode?: string;
}

function getPostExToken(): string | null {
  const token = process.env.POSTEX_API_TOKEN?.trim();
  return token || null;
}

export function isPostExConfigured(): boolean {
  return Boolean(getPostExToken());
}

function pickHistoryTimestamp(
  row: Record<string, unknown>
): string | undefined {
  const keys = [
    "transactionStatusDateTime",
    "transactionStatusDate",
    "transactionDateTime",
    "statusDateTime",
    "statusDate",
    "createdAt",
    "created_at",
    "updatedAt",
    "updated_at",
    "dateTime",
    "datetime",
    "time",
    "date",
  ];
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) {
      return new Date(value).toISOString();
    }
  }
  return undefined;
}

export async function trackPostExOrder(
  trackingNumber: string
): Promise<PostExTrackResult | PostExTrackError> {
  const token = getPostExToken();
  if (!token) {
    return {
      ok: false,
      error: "PostEx tracking is not configured. Contact the store.",
    };
  }

  const cleaned = trackingNumber.trim();
  if (!cleaned) {
    return { ok: false, error: "Tracking number is required." };
  }

  const url = `${POSTEX_TRACK_URL}/${encodeURIComponent(cleaned)}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        token,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await res.text();
    let data: {
      statusCode?: string | number;
      statusMessage?: string;
      dist?: PostExTrackDist | null;
    } | null = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!res.ok || !data) {
      return {
        ok: false,
        error:
          data?.statusMessage ||
          (res.status === 404
            ? "Tracking number not found on PostEx."
            : `PostEx returned HTTP ${res.status}. Check the tracking number.`),
        statusCode: data?.statusCode != null ? String(data.statusCode) : undefined,
      };
    }

    const code = String(data.statusCode ?? "");
    if (code && code !== "200") {
      return {
        ok: false,
        error: data.statusMessage || "Unable to track this shipment.",
        statusCode: code,
      };
    }

    const dist = data.dist;
    if (!dist) {
      return {
        ok: false,
        error: data.statusMessage || "No tracking data found for this number.",
        statusCode: code || undefined,
      };
    }

    const rawHistory = Array.isArray(dist.transactionStatusHistory)
      ? dist.transactionStatusHistory
      : [];

    const history = rawHistory
      .map((h) => {
        const row = h as PostExStatusHistoryItem & Record<string, unknown>;
        const message = String(row.transactionStatusMessage || "").trim();
        const at = pickHistoryTimestamp(row);
        return {
          message,
          code:
            row.transactionStatusMessageCode != null
              ? String(row.transactionStatusMessageCode)
              : undefined,
          at,
        };
      })
      .filter((h) => h.message);

    // PostEx returns journey oldest → newest. Prefer latest scan over
    // transactionStatus (that field can lag or show a route label).
    const latestScan = history.length ? history[history.length - 1].message : null;
    const status =
      latestScan || dist.transactionStatus?.trim() || "In transit";

    return {
      ok: true,
      status,
      trackingNumber: dist.trackingNumber?.trim() || cleaned,
      orderRefNumber: dist.orderRefNumber?.trim() || null,
      cityName: dist.cityName?.trim() || null,
      orderPickupDate: dist.orderPickupDate || null,
      orderDeliveryDate: dist.orderDeliveryDate || null,
      history,
      raw: dist,
    };
  } catch {
    return {
      ok: false,
      error: "Could not reach PostEx right now. Please try again shortly.",
    };
  }
}

/** Normalize PK phones for comparison: digits only, 92xxxxxxxxxx → 0xxxxxxxxxx */
export function normalizePkPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length >= 12) {
    digits = `0${digits.slice(2)}`;
  }
  if (digits.length === 10 && digits.startsWith("3")) {
    digits = `0${digits}`;
  }
  return digits;
}

export function phonesMatch(a: string, b: string): boolean {
  const na = normalizePkPhone(a);
  const nb = normalizePkPhone(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Allow match on last 10 digits (handles leading 0 vs not)
  return na.slice(-10) === nb.slice(-10);
}
