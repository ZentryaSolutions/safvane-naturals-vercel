import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { trackPostExOrder, isPostExConfigured } from "@/lib/postex";

export const dynamic = "force-dynamic";

type TrackBody = {
  trackingNumber?: string;
};

/**
 * Public tracking by PostEx tracking ID only.
 * Does not require admin to save anything on the order first.
 */
export async function POST(req: NextRequest) {
  let body: TrackBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const trackingNumber = body.trackingNumber?.trim() || "";
  if (!trackingNumber) {
    return NextResponse.json(
      { error: "Enter your PostEx tracking ID." },
      { status: 400 }
    );
  }

  if (!isPostExConfigured()) {
    return NextResponse.json(
      {
        error:
          "Tracking is temporarily unavailable. Please try again later or contact us on WhatsApp.",
      },
      { status: 503 }
    );
  }

  const tracked = await trackPostExOrder(trackingNumber);

  if (!tracked.ok) {
    return NextResponse.json(
      { error: tracked.error || "Unable to track this ID. Check and try again." },
      { status: 404 }
    );
  }

  // Best-effort: if admin already linked this ID to an order, refresh cached status
  try {
    const supabase = createServiceClient();
    await supabase
      .from("orders")
      .update({
        tracking_status: tracked.status,
        tracking_synced_at: new Date().toISOString(),
      })
      .eq("tracking_number", tracked.trackingNumber);
  } catch {
    // non-blocking
  }

  return NextResponse.json({
    shipment: {
      trackingNumber: tracked.trackingNumber,
      status: tracked.status,
      cityName: tracked.cityName,
      orderRefNumber: tracked.orderRefNumber,
      orderPickupDate: tracked.orderPickupDate,
      orderDeliveryDate: tracked.orderDeliveryDate,
      history: tracked.history,
      provider: "postex",
    },
  });
}
