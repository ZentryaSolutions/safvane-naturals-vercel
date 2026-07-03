"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { freeShippingBannerText } from "@/lib/shipping";

function getTimeLeft(endIso: string) {
  const diff = new Date(endIso).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s };
}

export function PromoBanner({ settings }: { settings: SiteSettings | null }) {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);

  const promoEnabled = settings?.promo_enabled;
  const headline = settings?.promo_headline?.trim();
  const message = settings?.promo_message?.trim();
  const endsAt = settings?.promo_ends_at;
  const freeShippingText = freeShippingBannerText(settings);

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setTimeLeft(getTimeLeft(endsAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const showPromo = promoEnabled && (headline || message);
  const promoExpired =
    showPromo && endsAt ? Date.now() > new Date(endsAt).getTime() : false;
  const activePromo = showPromo && !promoExpired;
  const showFreeShipping = !activePromo && Boolean(freeShippingText);

  if (!activePromo && !showFreeShipping) return null;

  return (
    <div className="promo-banner" role="status">
      <div className="promo-banner-inner">
        <div className="promo-banner-text">
          {activePromo ? (
            <>
              {headline && <strong>{headline}</strong>}
              {message && <span>{message}</span>}
            </>
          ) : (
            <span>{freeShippingText}</span>
          )}
        </div>
        {activePromo && timeLeft && (
          <div className="promo-countdown" aria-live="polite">
            <span>{String(timeLeft.h).padStart(2, "0")}h</span>
            <span>{String(timeLeft.m).padStart(2, "0")}m</span>
            <span>{String(timeLeft.s).padStart(2, "0")}s</span>
          </div>
        )}
      </div>
    </div>
  );
}
