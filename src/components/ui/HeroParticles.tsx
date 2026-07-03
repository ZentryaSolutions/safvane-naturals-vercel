"use client";

import { useEffect, useState } from "react";

export function HeroParticles() {
  const [particles, setParticles] = useState<
    { id: number; left: number; size: number; duration: number; delay: number }[]
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: Math.random() * 3 + 1.5,
        duration: 8 + Math.random() * 14,
        delay: Math.random() * 12,
      }))
    );
  }, []);

  return (
    <div className="hero-particles" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
