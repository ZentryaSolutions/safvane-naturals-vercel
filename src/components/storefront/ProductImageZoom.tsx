"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface ProductImageZoomProps {
  src: string;
  alt: string;
  priority?: boolean;
}

export function ProductImageZoom({
  src,
  alt,
  priority = false,
}: ProductImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  };

  return (
    <div
      ref={containerRef}
      className="pdp-zoom-stage"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={handleMove}
    >
      <div
        className={`pdp-zoom-lens${active ? " is-zoomed" : ""}`}
        style={{
          transformOrigin: `${origin.x}% ${origin.y}%`,
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 45vw"
          className="pdp-zoom-img"
        />
      </div>
      <div className="pdp-zoom-hint" aria-hidden>
        {active ? "Move to explore" : "Hover to zoom"}
      </div>
    </div>
  );
}
