import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { BRAND, NAV_LINKS } from "@/lib/constants";
import { CartBadge } from "./CartBadge";
import { MobileNav } from "./MobileNav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-200/60 bg-brand-cream/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
            S
          </span>
          <div className="leading-tight">
            <span className="block font-serif text-lg font-semibold text-brand-900">
              {BRAND.name}
            </span>
            <span className="hidden text-xs text-brand-600 sm:block">
              Pure & Natural
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brand-800 transition hover:text-brand-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-800 transition hover:bg-brand-200"
            aria-label="Shopping cart"
          >
            <ShoppingBag className="h-5 w-5" />
            <CartBadge />
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
