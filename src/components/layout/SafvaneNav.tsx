"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { CartBadge } from "@/components/layout/CartBadge";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NAV_LINKS } from "@/lib/constants";

export function SafvaneNav() {
  const pathname = usePathname();
  const [stuck, setStuck] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav id="safvane-nav" className={stuck ? "stuck" : ""}>
        <BrandLogo href="/" variant="default" className="logo-mark" />

        <div className="nav-links">
          <Link
            href="/"
            className={`nl-btn${pathname === "/" ? " on" : ""}`}
          >
            Home
          </Link>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nl-btn${isActive(link.href) ? " on" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="nav-end">
          <div className="nav-actions">
            <ThemeToggle />
          </div>

          <Link href="/cart" className="nav-cart">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          Cart
          <CartBadge />
        </Link>
        </div>

        <button
          type="button"
          className="nav-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </nav>

      {mobileOpen && (
        <div className="nav-mobile-menu">
          <Link href="/" className={pathname === "/" ? "on" : ""}>
            Home
          </Link>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? "on" : ""}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/cart">Cart</Link>
        </div>
      )}
    </>
  );
}
