import Image from "next/image";
import Link from "next/link";
import { RichTextContent } from "@/components/storefront/RichTextContent";
import { Reveal } from "@/components/ui/Reveal";
import { CONTACT, HERO_BANNER_IMAGE } from "@/lib/constants";
import { getContentPage } from "@/lib/data";

export const metadata = { title: "About" };

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
  { step: "01", title: "Source", text: "Premium seeds selected for purity and potency." },
  { step: "02", title: "Cold Press", text: "Slow-pressed without heat to preserve nutrients." },
  { step: "03", title: "Filter & Bottle", text: "Naturally settled, bottled in protective amber glass." },
  { step: "04", title: "Deliver", text: "Shipped across Pakistan — pay on delivery, no risk." },
];

export default async function AboutPage() {
  const page = await getContentPage("about");

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
              <strong>Safvane Naturals Pvt. Ltd.</strong> is a Pakistan-based wellness
              brand (CUIN {CONTACT.cuin}) crafting cold-pressed, chemical-free natural
              oils — starting with our signature black seed oil and expanding into a
              full range of pure botanical products.
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
            {page?.content ? (
              <RichTextContent content={page.content} />
            ) : (
              <>
                <Reveal delay={1}>
                  <p>
                    <strong>Safvane Naturals Pvt. Ltd.</strong> was incorporated in
                    Pakistan under CUIN {CONTACT.cuin}, with our operations based in
                    Attock. We are building a trusted name in natural wellness — oils
                    that are cold-pressed, unrefined, and free from additives,
                    preservatives, and synthetic fillers.
                  </p>
                </Reveal>
                <Reveal delay={2}>
                  <p>
                    Every bottle reflects our promise: label transparency, small-batch
                    quality, and nationwide delivery with cash on delivery. From sourcing
                    premium seeds to amber-glass packaging, we control each step so
                    families across Pakistan receive products they can trust.
                  </p>
                </Reveal>
                <Reveal delay={3}>
                  <p>
                    Safvane Naturals is more than a product line — it is our commitment
                    to honest natural wellness, made in Pakistan for Pakistan.
                  </p>
                </Reveal>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="about-process">
        <Reveal>
          <header className="about-section-head">
            <span className="about-eyebrow">Our Process</span>
            <h2>From seed to <em>your doorstep</em></h2>
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
          <p>Premium natural oils — delivered to your door. Pay only when it arrives.</p>
          <Link href="/shop" className="btn">
            <span>Shop Now</span>
          </Link>
        </section>
      </Reveal>
    </div>
  );
}
