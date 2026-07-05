import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import {
  ABOUT_COMMITMENTS,
  ABOUT_STORY,
  COMPANY_FACTS,
} from "@/lib/about-content";
import { CONTACT, HERO_BANNER_IMAGE } from "@/lib/constants";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About Safvane Naturals Pvt. Ltd.",
  description:
    "Safvane Naturals Pvt. Ltd. — Pakistan's premium cold-pressed black seed oil brand. Incorporated in Attock (CUIN 0343184). Pure, transparent, small-batch natural wellness.",
  path: "/about",
});

const VALUES = [
  {
    title: "100% Pure",
    desc: "Cold-pressed, unrefined oils with no fillers, heat damage, or hidden additives.",
  },
  {
    title: "Small Batches",
    desc: "Crafted in careful batches so freshness and quality stay consistent.",
  },
  {
    title: "Transparent",
    desc: "What you read on the label is exactly what goes into every bottle.",
  },
  {
    title: "Made in Pakistan",
    desc: "Locally produced, bottled, and delivered nationwide with cash on delivery.",
  },
];

const PROCESS = [
  { step: "01", title: "Source", text: "Premium black seeds selected for purity and potency." },
  { step: "02", title: "Cold Press", text: "Slow-pressed without heat to preserve natural nutrients." },
  { step: "03", title: "Filter & Bottle", text: "Naturally settled, bottled in protective amber glass." },
  { step: "04", title: "Deliver", text: "Shipped across Pakistan — pay on delivery, no risk." },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-copy">
          <Reveal>
            <span className="about-eyebrow">Our Story</span>
          </Reveal>
          <Reveal delay={1}>
            <h1>
              Nature&apos;s purity,
              <br />
              <em>bottled with care.</em>
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="about-hero-lead">
              <strong>{CONTACT.company}</strong> (CUIN {CONTACT.cuin}) is a Pakistan-based
              wellness brand crafting cold-pressed, chemical-free natural oils — starting
              with our signature black seed oil and growing into a full range of pure
              botanical products.
            </p>
          </Reveal>
          <Reveal delay={3}>
            <div className="about-hero-actions">
              <Link href="/shop" className="btn">
                <span>Explore Shop</span>
              </Link>
              <Link href="/contact" className="btn-ghost">
                Contact Us
              </Link>
            </div>
          </Reveal>
        </div>
        <Reveal delay={2} className="about-hero-visual">
          <div className="about-hero-image-wrap">
            <Image
              src={HERO_BANNER_IMAGE}
              alt="Safvane Naturals premium natural oils"
              width={640}
              height={720}
              className="about-hero-image"
              priority
            />
          </div>
        </Reveal>
      </section>

      <section className="about-values">
        {VALUES.map((item, i) => (
          <Reveal key={item.title} delay={(i % 4) as 1 | 2 | 3 | 4}>
            <article className="about-value-card">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          </Reveal>
        ))}
      </section>

      <section className="about-story">
        <div className="about-story-grid">
          <Reveal>
            <div className="about-story-intro">
              <span className="about-eyebrow">Why we started</span>
              <h2>
                A brand built on <em>honesty</em> and quality.
              </h2>
            </div>
          </Reveal>
          <div className="about-story-body prose-dark">
            {ABOUT_STORY.map((paragraph, i) => (
              <Reveal key={paragraph.slice(0, 40)} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="about-commitments">
        <Reveal>
          <header className="about-section-head">
            <span className="about-eyebrow">Our promise</span>
            <h2>
              What you can <em>always</em> expect from us
            </h2>
          </header>
        </Reveal>
        <div className="about-commitments-grid">
          {ABOUT_COMMITMENTS.map((item, i) => (
            <Reveal key={item.title} delay={(i % 4) as 1 | 2 | 3 | 4}>
              <article className="about-commitment-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="about-process">
        <Reveal>
          <header className="about-section-head">
            <span className="about-eyebrow">Our Process</span>
            <h2>
              From seed to <em>your doorstep</em>
            </h2>
          </header>
        </Reveal>
        <div className="about-process-grid">
          {PROCESS.map((item, i) => (
            <Reveal key={item.step} delay={(i % 4) as 1 | 2 | 3 | 4}>
              <article className="about-process-card">
                <span className="about-process-step">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="about-company">
        <Reveal>
          <header className="about-section-head">
            <span className="about-eyebrow">Company</span>
            <h2>
              Registered, transparent, <em>reachable</em>
            </h2>
          </header>
        </Reveal>
        <dl className="about-company-facts">
          {COMPANY_FACTS.map((fact, i) => (
            <Reveal key={fact.label} delay={(i % 4) as 1 | 2 | 3 | 4}>
              <div className="about-company-fact">
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </section>

      <section className="about-stats-bar">
        <Reveal>
          <div className="about-stat">
            <strong>100%</strong>
            <span>Pure, unrefined ingredients</span>
          </div>
        </Reveal>
        <Reveal delay={1}>
          <div className="about-stat">
            <strong>0</strong>
            <span>Chemicals or synthetic additives</span>
          </div>
        </Reveal>
        <Reveal delay={2}>
          <div className="about-stat">
            <strong>COD</strong>
            <span>Nationwide cash on delivery</span>
          </div>
        </Reveal>
      </section>

      <Reveal>
        <section className="about-cta">
          <h2>Ready to experience the difference?</h2>
          <p>
            Premium natural oils — delivered to your door. Pay only when it arrives.
          </p>
          <div className="about-hero-actions" style={{ justifyContent: "center" }}>
            <Link href="/shop" className="btn">
              <span>Shop Now</span>
            </Link>
            <Link href="/faq" className="btn-ghost">
              Read FAQ
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
