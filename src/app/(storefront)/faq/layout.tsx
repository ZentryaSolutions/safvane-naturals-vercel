import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllFaqItems } from "@/lib/faq-content";
import { buildPageMetadata, faqPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ — Black Seed Oil, Delivery & Orders",
  description:
    "Answers about Safvane Naturals black seed oil, cash on delivery, shipping across Pakistan, storage, returns, and product purity.",
  path: "/faq",
});

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={faqPageJsonLd(getAllFaqItems())} />
      {children}
    </>
  );
}
