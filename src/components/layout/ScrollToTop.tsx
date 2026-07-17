"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function scrollWindowToTop() {
  if (typeof window === "undefined") return;

  // Disable browser scroll restoration so client navigations stay at top (esp. iOS)
  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  } catch {
    // ignore
  }

  const top = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  top();
  // Next.js / iOS sometimes restore scroll after paint — nudge again
  requestAnimationFrame(top);
  window.setTimeout(top, 0);
  window.setTimeout(top, 50);
  window.setTimeout(top, 150);
}

/**
 * On every storefront route change, jump to the top of the page.
 * Fixes mobile checkout → order confirmation (and other navigations)
 * where the viewport stays mid-page.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";

  useEffect(() => {
    // Allow in-page hash anchors (e.g. #reviews) to keep native jump
    if (typeof window !== "undefined" && window.location.hash) return;
    scrollWindowToTop();
  }, [pathname, search]);

  return null;
}
