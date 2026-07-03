"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

const FAQ_SECTIONS = [
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
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`faq-acc${open ? " open" : ""}`}>
      <button
        type="button"
        className="faq-acc-head"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M5 12h14M12 5v14" />
        </svg>
      </button>
      <div className="faq-acc-body">
        <div className="faq-acc-body-inner">
          <p>{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [section, setSection] = useState(0);
  const active = FAQ_SECTIONS[section];

  return (
    <div className="faq-page">
      <section className="faq-hero-sec">
        <Reveal>
          <span className="faq-eyebrow">Help Center</span>
          <h1>
            <em>Frequently</em> Asked Questions
          </h1>
          <p>Clear answers about ordering, products, delivery, and returns.</p>
        </Reveal>
      </section>

      <div className="faq-body">
        <aside className="faq-sidebar">
          <p className="faq-sidebar-label">Categories</p>
          {FAQ_SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={section === i ? "on" : ""}
              onClick={() => setSection(i)}
            >
              {s.title}
              <span className="faq-sidebar-count">{s.items.length}</span>
            </button>
          ))}
          <div className="faq-sidebar-help">
            <p>Still need help?</p>
            <Link href="/contact">Contact us →</Link>
          </div>
        </aside>

        <div className="faq-main">
          <div className="faq-main-head">
            <h2>{active.title}</h2>
            <p>{active.items.length} questions</p>
          </div>
          <div className="faq-list">
            {active.items.map((item) => (
              <AccordionItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
