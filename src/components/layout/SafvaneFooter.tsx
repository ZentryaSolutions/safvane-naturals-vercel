import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { WhatsAppButton } from "@/components/storefront/WhatsAppButton";
import { getSiteSettings } from "@/lib/data";
import { CONTACT, NAV_LINKS, SOCIAL_LINKS, WHATSAPP_DEFAULT_MESSAGE, WHATSAPP_NUMBER } from "@/lib/constants";
import { getWhatsAppLink } from "@/lib/utils";

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YoutubeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  tiktok: TikTokIcon,
} as const;

export async function SafvaneFooter() {
  const settings = await getSiteSettings();
  const phone = settings?.notification_whatsapp_number ?? WHATSAPP_NUMBER;
  const whatsapp = getWhatsAppLink(phone, WHATSAPP_DEFAULT_MESSAGE);
  const contactPhone = settings?.contact_phone ?? CONTACT.phoneDisplay;
  const contactEmail = settings?.contact_email ?? CONTACT.email;
  const contactAddress = settings?.contact_address ?? CONTACT.address;

  return (
    <footer className="safvane-footer">
      <div className="ft-top">
        <div className="ft-brand-col">
          <BrandLogo href="/" variant="footer" className="ft-logo" />
          <p className="ft-desc">
            Premium cold-pressed black seed oil — 100% pure, unrefined, and crafted
            with care in Pakistan. Delivered nationwide with cash on delivery.
          </p>
          <div className="ft-social" aria-label="Social media">
            {SOCIAL_LINKS.map((link) => {
              const Icon = SOCIAL_ICONS[link.id];
              return (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ft-soc-btn"
                  aria-label={link.label}
                >
                  <Icon size={17} />
                </a>
              );
            })}
          </div>
          <div className="ft-wa">
            <WhatsAppButton label="Chat on WhatsApp" phone={phone} />
          </div>
        </div>

        <div className="ft-col">
          <h5>Shop</h5>
          <ul>
            <li>
              <Link href="/shop">All Products</Link>
            </li>
            <li>
              <Link href="/shop">Black Seed Oil</Link>
            </li>
          </ul>
        </div>

        <div className="ft-col">
          <h5>Company</h5>
          <ul>
            {NAV_LINKS.filter((l) => l.href !== "/shop").map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="ft-col ft-contact-col">
          <h5>Contact</h5>
          <ul className="ft-contact-list">
            <li>
              <span className="ft-contact-label">Email</span>
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </li>
            <li>
              <span className="ft-contact-label">WhatsApp</span>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                {contactPhone}
              </a>
            </li>
            <li>
              <span className="ft-contact-label">Address</span>
              <span>{contactAddress}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="ft-bottom">
        <div>
          © {new Date().getFullYear()} {CONTACT.company}
        </div>
        <div className="ft-bottom-right">
          <span>All prices in PKR</span>
          <span className="ft-dot" aria-hidden>
            ·
          </span>
          <span>Cash on Delivery</span>
          <span className="ft-dot" aria-hidden>
            ·
          </span>
          <span>Made in Pakistan</span>
        </div>
      </div>
    </footer>
  );
}
