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

function getTouchDistance(touches: React.TouchList | TouchList) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
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
  const pinchStart = useRef({ distance: 0, scale: 1 });
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0, active: false });
  const lastTap = useRef(0);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStart.current = {
        distance: getTouchDistance(e.touches),
        scale,
      };
      dragStart.current.active = false;
      return;
    }

    if (e.touches.length === 1 && scale > 1) {
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        tx: translate.x,
        ty: translate.y,
        active: true,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      const ratio = distance / pinchStart.current.distance;
      const next = Math.min(4, Math.max(1, pinchStart.current.scale * ratio));
      setScale(next);
      if (next <= 1.05) {
        setTranslate({ x: 0, y: 0 });
      }
      return;
    }

    if (e.touches.length === 1 && dragStart.current.active && scale > 1) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setTranslate({
        x: dragStart.current.tx + dx,
        y: dragStart.current.ty + dy,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length > 0) return;

    dragStart.current.active = false;
    pinchStart.current.scale = scale;

    if (scale < 1.05) resetZoom();

    const now = Date.now();
    if (now - lastTap.current < 280 && e.changedTouches.length === 1) {
      if (scale > 1.1) {
        resetZoom();
      } else {
        setScale(2.5);
      }
    }
    lastTap.current = now;
  };

  return createPortal(
    <div
      className="pdp-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Product image viewer"
      onClick={onClose}
    >
      <button
        type="button"
        className="pdp-lightbox-close"
        onClick={onClose}
        aria-label="Close image viewer"
      >
        ×
      </button>
      <div
        className="pdp-lightbox-stage"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="pdp-lightbox-img"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
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
  const [isTouch, setIsTouch] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const swipeStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const blockTap = useRef(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      setIsTouch(
        window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 1024
      );
    };
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

  const handleStageClick = () => {
    if (blockTap.current || !isTouch) return;
    setLightboxOpen(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
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
        onClick={handleStageClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role={isTouch ? "button" : undefined}
        tabIndex={isTouch ? 0 : undefined}
        onKeyDown={(e) => {
          if (isTouch && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setLightboxOpen(true);
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
