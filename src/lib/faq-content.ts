export const FAQ_SECTIONS = [
  {
    id: "orders",
    title: "Orders & Delivery",
    items: [
      {
        q: "How does Cash on Delivery work?",
        a: "Place your order online with no upfront payment. When your package arrives, pay the rider in cash. Simple and risk-free.",
      },
      {
        q: "How long does delivery take?",
        a: "Most orders arrive within 2–4 business days across Pakistan. Major cities are usually faster.",
      },
      {
        q: "What are the shipping charges?",
        a: "Shipping is shown clearly in your cart before checkout. Some products and promotions include free shipping — look for the Free Shipping badge on the product page.",
      },
      {
        q: "Do you ship outside Pakistan?",
        a: "We currently deliver within Pakistan only. International shipping is on our roadmap.",
      },
    ],
  },
  {
    id: "products",
    title: "Products",
    items: [
      {
        q: "Are your oils 100% pure?",
        a: "Yes. Every Safvane oil is cold-pressed and unrefined — no additives, fillers, preservatives, or synthetic ingredients.",
      },
      {
        q: "How should I store the oil?",
        a: "Keep in a cool, dry place away from direct sunlight. Refrigerate after opening to maintain freshness longer.",
      },
      {
        q: "Can I use black seed oil for cooking?",
        a: "Our black seed oil is suitable for daily internal use (1–2 tsp) and topical application. It is not recommended for high-heat cooking.",
      },
      {
        q: "How do I know which size to choose?",
        a: "50ml is ideal for trying the product. 100ml offers better value for regular daily use.",
      },
    ],
  },
  {
    id: "returns",
    title: "Returns & Support",
    items: [
      {
        q: "What is your return policy?",
        a: "If your order arrives damaged or incorrect, contact us within 48 hours with photos. We will arrange a replacement at no extra cost.",
      },
      {
        q: "How can I track my order?",
        a: "After placing your order, our team confirms it via WhatsApp or email with delivery details.",
      },
      {
        q: "How do I contact support?",
        a: "Reach us via the Contact page form, WhatsApp, or email at info@safvane.com. We respond within 24 hours on business days.",
      },
      {
        q: "Is Safvane Naturals a registered company?",
        a: "Yes. Safvane Naturals Pvt. Ltd. is incorporated in Pakistan (CUIN 0343184), based in Attock.",
      },
    ],
  },
] as const;

export function getAllFaqItems(): { q: string; a: string }[] {
  return FAQ_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({ q: item.q, a: item.a }))
  );
}
