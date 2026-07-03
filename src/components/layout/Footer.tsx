import Link from "next/link";
import { BRAND } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-brand-200 bg-brand-900 text-brand-100">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="font-serif text-xl font-semibold text-white">
              {BRAND.name}
            </h3>
            <p className="mt-2 text-sm text-brand-200">{BRAND.tagline}</p>
          </div>
          <div>
            <h4 className="font-medium text-white">Quick Links</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/shop" className="hover:text-white">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white">Our Promise</h4>
            <p className="mt-3 text-sm text-brand-200">
              100% natural, cold-pressed black seed oil — crafted with care for
              your wellness journey.
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-brand-700 pt-6 text-center text-sm text-brand-300">
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
