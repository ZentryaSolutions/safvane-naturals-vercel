"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { FAQ_SECTIONS } from "@/lib/faq-content";

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
