import { NextResponse } from "next/server";
import {
  getClientIp,
  readMetaCookies,
  sendMetaCapiEvent,
  type MetaCapiEventName,
} from "@/lib/meta-capi";

const ALLOWED: MetaCapiEventName[] = [
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
];

type Body = {
  eventName?: string;
  eventId?: string;
  eventSourceUrl?: string;
  value?: number;
  currency?: "PKR";
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
  contentIds?: string[];
  contentName?: string;
  numItems?: number;
};

/**
 * Mirror browser Pixel events to Conversions API with the same event_id
 * (fixes Meta Diagnostics: improve ViewContent / funnel CAPI coverage).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const eventName = body.eventName as MetaCapiEventName | undefined;

    if (!eventName || !ALLOWED.includes(eventName)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }
    if (!body.eventId?.trim()) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const { fbp, fbc } = readMetaCookies(request.headers.get("cookie"));
    const sourceUrl =
      body.eventSourceUrl?.trim() ||
      request.headers.get("referer") ||
      "https://www.safvane.com";

    const ok = await sendMetaCapiEvent({
      eventName,
      eventId: body.eventId.trim(),
      eventSourceUrl: sourceUrl.slice(0, 1024),
      value: body.value,
      currency: body.currency || "PKR",
      contents: body.contents,
      contentIds: body.contentIds,
      contentName: body.contentName,
      contentType: "product",
      numItems: body.numItems,
      clientIp: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
      fbp,
      fbc,
      country: "pk",
    });

    return NextResponse.json({ ok });
  } catch (e) {
    console.error("[api/meta/capi]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
