import { SafvaneNav } from "@/components/layout/SafvaneNav";
import { SafvaneFooter } from "@/components/layout/SafvaneFooter";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { PromoBanner } from "@/components/storefront/PromoBanner";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { getSiteSettings } from "@/lib/data";
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
        <SafvaneNav />
        <PromoBanner settings={settings} />
        <main className="storefront-main">{children}</main>
        <SafvaneFooter />
        <WhatsAppFloat />
      </CartProvider>
    </ThemeProvider>
  );
}
