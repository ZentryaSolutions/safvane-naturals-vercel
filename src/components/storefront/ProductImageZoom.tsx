"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface ProductImageZoomProps {
  src: string;
  alt: string;
  priority?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

function getTouchDistance(touches: TouchList | React.TouchList) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function detectTouchDevice() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches ||
    "ontouchstart" in window ||
    window.innerWidth <= 1024
  );
}

function ProductImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const pinchStart = useRef({ distance: 0, scale: 1 });
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0, active: false });
  const lastTap = useRef(0);
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const openedAt = useRef(Date.now());

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  useEffect(() => {
    translateRef.current = translate;
  }, [translate]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /** iOS fires a synthetic click after touchend — ignore close for a short window. */
  const safeClose = useCallback(() => {
    if (Date.now() - openedAt.current < 450) return;
    onClose();
  }, [onClose]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // Native non-passive listeners so iOS pinch/zoom works (React onTouchMove is passive)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        pinchStart.current = {
          distance: getTouchDistance(e.touches),
          scale: scaleRef.current,
        };
        dragStart.current.active = false;
        return;
      }
      if (e.touches.length === 1 && scaleRef.current > 1) {
        dragStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          tx: translateRef.current.x,
          ty: translateRef.current.y,
          active: true,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const distance = getTouchDistance(e.touches);
        const ratio = distance / (pinchStart.current.distance || 1);
        const next = Math.min(4, Math.max(1, pinchStart.current.scale * ratio));
        setScale(next);
        if (next <= 1.05) setTranslate({ x: 0, y: 0 });
        return;
      }
      if (e.touches.length === 1 && dragStart.current.active && scaleRef.current > 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - dragStart.current.x;
        const dy = e.touches[0].clientY - dragStart.current.y;
        setTranslate({
          x: dragStart.current.tx + dx,
          y: dragStart.current.ty + dy,
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length > 0) return;
      dragStart.current.active = false;
      pinchStart.current.scale = scaleRef.current;
      if (scaleRef.current < 1.05) resetZoom();

      const now = Date.now();
      if (now - lastTap.current < 280 && e.changedTouches.length === 1) {
        if (scaleRef.current > 1.1) resetZoom();
        else setScale(2.5);
      }
      lastTap.current = now;
    };

    stage.addEventListener("touchstart", onTouchStart, { passive: false });
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    stage.addEventListener("touchend", onTouchEnd);

    return () => {
      stage.removeEventListener("touchstart", onTouchStart);
      stage.removeEventListener("touchmove", onTouchMove);
      stage.removeEventListener("touchend", onTouchEnd);
    };
  }, [resetZoom]);

  return createPortal(
    <div
      className="pdp-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Product image viewer"
      onClick={safeClose}
    >
      <button
        type="button"
        className="pdp-lightbox-close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close image viewer"
      >
        ×
      </button>
      <div
        ref={stageRef}
        className="pdp-lightbox-stage"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="pdp-lightbox-img"
          style={{
            transform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${scale})`,
            WebkitTransform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${scale})`,
          }}
          draggable={false}
        />
      </div>
      <p className="pdp-lightbox-hint" aria-hidden>
        Pinch or double-tap to zoom
      </p>
    </div>,
    document.body
  );
}

export function ProductImageZoom({
  src,
  alt,
  priority = false,
  onSwipeLeft,
  onSwipeRight,
}: ProductImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  // Default true so first tap on iPhone works before hydration effect runs
  const [isTouch, setIsTouch] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const swipeStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const blockTap = useRef(false);
  const usedTouch = useRef(false);

  useEffect(() => {
    setMounted(true);
    const update = () => setIsTouch(detectTouchDevice());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isTouch) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  };

  const openLightbox = () => {
    if (blockTap.current) return;
    setLightboxOpen(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    usedTouch.current = true;
    if (e.touches.length !== 1) return;
    swipeStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      t: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || e.changedTouches.length !== 1) return;

    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    const elapsed = Date.now() - start.t;

    // Tap → open lightbox (skip synthetic click that follows on iOS)
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && elapsed < 350) {
      openLightbox();
      return;
    }

    if (elapsed > 400 || Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) {
      return;
    }

    blockTap.current = true;
    window.setTimeout(() => {
      blockTap.current = false;
    }, 320);

    if (dx < 0) onSwipeLeft?.();
    else onSwipeRight?.();
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`pdp-zoom-stage${isTouch ? " pdp-zoom-stage--touch" : ""}`}
        onMouseEnter={() => !isTouch && setActive(true)}
        onMouseLeave={() => !isTouch && setActive(false)}
        onMouseMove={handleMove}
        onClick={() => {
          // Desktop / pointer devices; ignore ghost click after touch on iOS
          if (usedTouch.current) {
            usedTouch.current = false;
            return;
          }
          if (isTouch) openLightbox();
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role={isTouch ? "button" : undefined}
        tabIndex={isTouch ? 0 : undefined}
        onKeyDown={(e) => {
          if (isTouch && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openLightbox();
          }
        }}
        aria-label={isTouch ? "Tap to enlarge product image" : undefined}
      >
        <div
          className={`pdp-zoom-lens${active && !isTouch ? " is-zoomed" : ""}`}
          style={{
            transformOrigin: `${origin.x}% ${origin.y}%`,
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="pdp-zoom-img"
          />
        </div>
        <div className="pdp-zoom-hint" aria-hidden>
          {isTouch ? "Tap to enlarge" : active ? "Move to explore" : "Hover to zoom"}
        </div>
      </div>

      {mounted && lightboxOpen && (
        <ProductImageLightbox
          src={src}
          alt={alt}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
