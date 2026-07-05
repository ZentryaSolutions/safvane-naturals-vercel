import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — Pure Cold-Pressed Natural Oils`,
    short_name: BRAND.name,
    description: BRAND.description,
    start_url: "/",
    display: "standalone",
    background_color: "#090805",
    theme_color: "#c9a227",
    icons: [
      {
        src: "/icons/safvane-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
