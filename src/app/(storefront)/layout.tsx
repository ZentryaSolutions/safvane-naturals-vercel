import { SafvaneNav } from "@/components/layout/SafvaneNav";
import { SafvaneFooter } from "@/components/layout/SafvaneFooter";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { PromoBanner } from "@/components/storefront/PromoBanner";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { JsonLd } from "@/components/seo/JsonLd";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { getSiteSettings } from "@/lib/data";
import {
  localBusinessJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { Suspense } from "react";
import "@/styles/safvane.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <ThemeProvider>
      <CartProvider>
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <MetaPixel />
        <JsonLd
          data={[
            organizationJsonLd(),
            websiteJsonLd(),
            localBusinessJsonLd(),
          ]}
        />
        <SafvaneNav />
        <PromoBanner settings={settings} />
        <main className="storefront-main">{children}</main>
        <SafvaneFooter />
        <WhatsAppFloat />
      </CartProvider>
    </ThemeProvider>
  );
}
