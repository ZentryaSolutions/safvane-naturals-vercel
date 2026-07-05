export const FAQ_SECTIONS = [
  {
    id: "orders",
    title: "Orders & Delivery",
    items: [
      {
        q: "How does Cash on Delivery work?",
        a: "Place your order on our website with no upfront payment. We confirm your order by phone or WhatsApp, dispatch your parcel, and you pay the courier in cash when it arrives. Simple and risk-free.",
      },
      {
        q: "How long does delivery take?",
        a: "Most orders arrive within 2–4 business days across Pakistan. Major cities such as Lahore, Karachi, Islamabad, and Rawalpindi are often faster. Remote areas may take a little longer.",
      },
      {
        q: "What are the shipping charges?",
        a: "Shipping is calculated at checkout and shown clearly before you place your order. Selected products and promotions may qualify for free shipping — look for the Free Shipping badge on the product page.",
      },
      {
        q: "How will I know my order is confirmed?",
        a: "After checkout you receive an order confirmation on screen. Our team may also contact you by phone or WhatsApp to verify your address and delivery details before dispatch.",
      },
      {
        q: "Do you ship outside Pakistan?",
        a: "We currently deliver within Pakistan only. International shipping is on our roadmap for the future.",
      },
    ],
  },
  {
    id: "products",
    title: "Products & Usage",
    items: [
      {
        q: "Are Safvane oils 100% pure?",
        a: "Yes. Every Safvane oil is cold-pressed and unrefined — no additives, fillers, preservatives, or synthetic ingredients. We never blend with cheaper carrier oils.",
      },
      {
        q: "How should I store black seed oil?",
        a: "Keep the bottle in a cool, dry place away from direct sunlight. Refrigerate after opening to maintain freshness and extend shelf life.",
      },
      {
        q: "How do I take black seed oil daily?",
        a: "A common routine is 1 teaspoon (5 ml) once or twice daily, preferably with food. Always follow the guidance on your product label and consult a healthcare professional if you have medical conditions or take medication.",
      },
      {
        q: "Can I use black seed oil for cooking?",
        a: "Our black seed oil is suitable for daily internal use and topical application. It is not recommended for high-heat cooking, as heat can reduce beneficial compounds.",
      },
      {
        q: "Which size should I choose — 50ml or 100ml?",
        a: "50ml is ideal for first-time customers who want to try the product. 100ml offers better value for regular daily use and families.",
      },
      {
        q: "Is your packaging safe for the product?",
        a: "Yes. We use protective amber glass bottles to shield the oil from light and help preserve quality from our facility to your home.",
      },
    ],
  },
  {
    id: "quality",
    title: "Quality & Purity",
    items: [
      {
        q: "What does cold-pressed mean?",
        a: "Cold pressing extracts oil from seeds using mechanical pressure without high heat. This helps preserve natural nutrients, flavour, and aroma compared to heat-treated or chemically extracted oils.",
      },
      {
        q: "Do you add preservatives or chemicals?",
        a: "No. Our oils are single-ingredient and chemical-free. We do not use artificial preservatives, colours, or synthetic fillers.",
      },
      {
        q: "What is on the batch label?",
        a: "Each product batch includes a batch number and manufacturing/expiry information on the packaging, so you can trace when and how your bottle was produced.",
      },
      {
        q: "Are your products halal and natural?",
        a: "Our black seed oil is a pure botanical product with no animal-derived ingredients. We focus on natural, plant-based wellness oils.",
      },
    ],
  },
  {
    id: "returns",
    title: "Returns & Support",
    items: [
      {
        q: "What is your return or replacement policy?",
        a: "If your order arrives damaged, leaking, or incorrect, contact us within 48 hours with your order number and photos. We will arrange a replacement at no extra cost where applicable.",
      },
      {
        q: "Can I cancel my order?",
        a: "If your order has not yet been dispatched, contact us as soon as possible via WhatsApp or email and we will do our best to cancel or amend it before shipping.",
      },
      {
        q: "How do I contact customer support?",
        a: "Reach us through the Contact page, WhatsApp, or email at info@safvane.com. We aim to respond within 24 hours on business days.",
      },
      {
        q: "Is Safvane Naturals a registered company?",
        a: "Yes. Safvane Naturals Pvt. Ltd. is a registered private limited company in Pakistan (CUIN 0343184), headquartered in Attock City.",
      },
    ],
  },
] as const;

export function getAllFaqItems(): { q: string; a: string }[] {
  return FAQ_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({ q: item.q, a: item.a }))
  );
}
