import type { Metadata } from "next";
import { TrackOrderClient } from "@/components/storefront/TrackOrderClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Track your order",
  description:
    "Track your Safvane Naturals parcel with your PostEx tracking ID. Live courier status updates.",
  path: "/track-order",
});

export default function TrackOrderPage() {
  return <TrackOrderClient />;
}
