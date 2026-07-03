import Link from "next/link";
import Image from "next/image";
import {
  getProducts,
} from "@/lib/data";
import { Marquee } from "@/components/ui/Marquee";
import { HeroParticles } from "@/components/ui/HeroParticles";
import { Reveal } from "@/components/ui/Reveal";
import {
  HorizontalProductCard,
} from "@/components/storefront/ShopProductCard";
import { Testimonials } from "@/components/storefront/Testimonials";
import { HERO_BANNER_IMAGE } from "@/lib/constants";

export default async function HomePage() {
  const allProducts = await getProducts();

  return (
    <>
      <div className="hero">
        <div className="hero-bg" />
        <HeroParticles />

        <div className="hero-left">
          <Reveal>
            <div className="hero-eyebrow">
              Cold Pressed &nbsp;·&nbsp; Unrefined &nbsp;·&nbsp; Pakistan
            </div>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="hero-h1">
              Pure from
              <br />
              <em className="gold-shimmer">nature.</em>
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="hero-desc">
              A growing range of cold-pressed, chemical-free natural oils —
              crafted in small batches, bottled in amber glass, delivered
              nationwide with cash on delivery.
            </p>
          </Reveal>
          <Reveal delay={3}>
            <div className="hero-ctas">
              <Link href="/shop" className="btn">
                <span>Explore Shop</span>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link href="/about" className="btn-ghost">
                Our Story
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="hero-visual">
          <Image
            src={HERO_BANNER_IMAGE}
            alt="Safvane Naturals Black Seed Oil — cold pressed, unrefined, made in Pakistan"
            fill
            priority
            sizes="(max-width: 1040px) 100vw, 55vw"
            className="hero-visual-img"
          />
          <div className="hero-visual-overlay" aria-hidden />
        </div>

        <div className="hero-scroll-hint">
          <div className="scroll-line" />
          Scroll
        </div>
      </div>

      <Marquee />

      <div className="numbers-band">
        <Reveal>
          <div className="nb">
            <div className="nb-num gold-shimmer">100%</div>
            <div className="nb-label">
              Pure, unrefined ingredients in every bottle we make
            </div>
          </div>
        </Reveal>
        <Reveal delay={1}>
          <div className="nb">
            <div className="nb-num gold-shimmer">0</div>
            <div className="nb-label">
              Chemicals, additives, or synthetic fillers — ever
            </div>
          </div>
        </Reveal>
        <Reveal delay={2}>
          <div className="nb">
            <div className="nb-num gold-shimmer">1+</div>
            <div className="nb-label">
              Natural oil products in our growing range
            </div>
          </div>
        </Reveal>
        <Reveal delay={3}>
          <div className="nb">
            <div className="nb-num">🇵🇰</div>
            <div className="nb-label">
              Made, bottled, and delivered locally across Pakistan
            </div>
          </div>
        </Reveal>
      </div>

      {allProducts.length > 0 && (
        <div className="hscroll-section">
          <Reveal>
            <div className="hscroll-head">
              <h2>
                All <em>Products</em>
              </h2>
              <Link href="/shop" className="btn-ghost">
                Shop All →
              </Link>
            </div>
          </Reveal>
          <div className="hscroll-track">
            {allProducts.map((p) => (
              <HorizontalProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      <section className="process-section" aria-labelledby="process-heading">
        <div className="process-bg-glow" aria-hidden />
        <div className="process-inner">
          <Reveal>
            <header className="process-header">
              <span className="process-eyebrow">Our Craft</span>
              <div className="process-header-grid">
                <h2 id="process-heading">
                  From <em>seed</em>
                  <br />
                  to bottle.
                </h2>
                <p>
                  Every step in our process is designed to preserve the natural
                  potency of each oil. No heat. No solvents. No compromise — ever.
                </p>
              </div>
            </header>
          </Reveal>

          <div className="process-track">
            {[
              {
                n: "01",
                title: "Sourcing",
                text: "Premium Nigella Sativa seeds, selected from verified, trusted local growers.",
              },
              {
                n: "02",
                title: "Cold Pressing",
                text: "Pressed without heat — retaining every nutrient and the oil's full natural potency.",
              },
              {
                n: "03",
                title: "Unrefined",
                text: "No refining, deodorising, or bleaching. What goes in the bottle is exactly what nature made.",
              },
              {
                n: "04",
                title: "Bottled & Sealed",
                text: "Amber glass protects from light degradation. Sealed and dispatched straight to your door.",
              },
            ].map((step, i) => (
              <Reveal key={step.n} delay={(i + 1) as 1 | 2 | 3 | 4}>
                <article className="process-card">
                  <div className="process-card-top">
                    <span className="process-card-num">{step.n}</span>
                    <span className="process-card-line" aria-hidden />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />

      <Reveal>
        <div className="cta-section">
          <h2>
            Ready to experience <em>pure wellness?</em>
          </h2>
          <p>
            No additives. No heat. No compromise. Cash on delivery, all across
            Pakistan.
          </p>
          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link href="/shop" className="btn">
              <span>Shop Now</span>
            </Link>
            <Link href="/contact" className="btn-ghost">
              Ask a Question
            </Link>
          </div>
        </div>
      </Reveal>
    </>
  );
}
