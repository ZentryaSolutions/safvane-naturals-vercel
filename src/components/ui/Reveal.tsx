"use client";

import { useEffect, useRef } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isElementInView(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  return (
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= vh &&
    rect.left <= vw
  );
}

/**
 * Scroll reveal. Must never leave content permanently invisible on iOS Safari
 * (IntersectionObserver + overflow parents can miss entries).
 */
export function Reveal({
  children,
  className = "",
  delay,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: 1 | 2 | 3 | 4;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => {
      el.classList.add("in");
    };

    // Instantly visible if reduced motion, already on screen, or as safety fallback
    if (prefersReducedMotion() || isElementInView(el)) {
      reveal();
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      reveal();
      obs.disconnect();
    };

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting || e.intersectionRatio > 0) {
            finish();
          }
        });
      },
      { threshold: 0, rootMargin: "80px 0px 80px 0px" }
    );

    obs.observe(el);

    // iOS Safari / bfcache / overflow quirks: never leave opacity:0 forever
    const fallback = window.setTimeout(finish, 900);
    const onPageShow = () => finish();
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.clearTimeout(fallback);
      window.removeEventListener("pageshow", onPageShow);
      obs.disconnect();
    };
  }, []);

  const delayClass = delay ? ` d${delay}` : "";
  return (
    <div ref={ref} className={`rv${delayClass} ${className}`.trim()}>
      {children}
    </div>
  );
}
