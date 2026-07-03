import { Reveal } from "@/components/ui/Reveal";
import { Star } from "lucide-react";
import { getFeaturedHomeReviews } from "@/lib/data";
import Link from "next/link";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function Testimonials() {
  const reviews = await getFeaturedHomeReviews(6);

  return (
    <section className="testimonials-section" aria-labelledby="testimonials-heading">
      <div className="testimonials-inner">
        <Reveal>
          <header className="testimonials-header">
            <span className="testimonials-eyebrow">Testimonials</span>
            <h2 id="testimonials-heading">
              What Customers <em>Say</em>
            </h2>
            <p>Real reviews from customers across Pakistan who trust Safvane Naturals.</p>
          </header>
        </Reveal>

        {reviews.length === 0 ? (
          <p className="testimonials-empty">
            Featured reviews will appear here. In admin, approve reviews and click the home
            icon to feature them on the homepage.
          </p>
        ) : (
          <div className="testimonials-grid">
            {reviews.map((review, i) => (
              <Reveal key={review.id} delay={((i % 3) + 1) as 1 | 2 | 3}>
                <article className="testimonial-card">
                  <div
                    className="testimonial-stars"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }).map((_, star) => (
                      <Star
                        key={star}
                        size={14}
                        fill={star < review.rating ? "currentColor" : "none"}
                        strokeWidth={star < review.rating ? 0 : 1.5}
                        style={star >= review.rating ? { opacity: 0.25 } : undefined}
                      />
                    ))}
                  </div>
                  {review.review_title && (
                    <p className="testimonial-title">{review.review_title}</p>
                  )}
                  <blockquote className="testimonial-quote">
                    &ldquo;{review.review_text}&rdquo;
                  </blockquote>
                  <footer className="testimonial-author">
                    <span className="testimonial-avatar" aria-hidden>
                      {initials(review.customer_name)}
                    </span>
                    <span>
                      <cite className="testimonial-name">{review.customer_name}</cite>
                      <span className="testimonial-city">
                        {review.customer_city ? `${review.customer_city}, Pakistan` : "Pakistan"}
                      </span>
                      {review.product?.name && (
                        <Link
                          href={`/products/${review.product.slug}`}
                          className="testimonial-product"
                        >
                          {review.product.name}
                        </Link>
                      )}
                    </span>
                  </footer>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
