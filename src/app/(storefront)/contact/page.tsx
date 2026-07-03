import { ContactForm } from "@/components/storefront/ContactForm";
import { getSiteSettings } from "@/lib/data";
import { getWhatsAppLink } from "@/lib/utils";
import {
  CONTACT,
  SOCIAL_LINKS,
  WEBSITE_URL,
  WHATSAPP_DEFAULT_MESSAGE,
  WHATSAPP_NUMBER,
} from "@/lib/constants";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSiteSettings();

  const phone = settings?.contact_phone ?? CONTACT.phoneDisplay;
  const email = settings?.contact_email ?? CONTACT.email;
  const address = settings?.contact_address ?? CONTACT.address;
  const whatsapp = getWhatsAppLink(
    settings?.notification_whatsapp_number ?? WHATSAPP_NUMBER,
    WHATSAPP_DEFAULT_MESSAGE
  );

  return (
    <div className="contact-wrap">
      <div className="cl">
        <Reveal>
          <h1>
            <em>Get in</em> touch.
          </h1>
          <p className="cl-sub">
            Questions about an order, a product, or wholesale? Send us a message
            or reach out directly — we typically respond within 24 hours.
          </p>
        </Reveal>

        <div className="ci">
          <div className="ci-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
          </div>
          <div>
            <h5>Phone / WhatsApp</h5>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
              {phone}
            </a>
          </div>
        </div>

        <div className="ci">
          <div className="ci-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 7l-10 6L2 7" />
            </svg>
          </div>
          <div>
            <h5>Email</h5>
            <a href={`mailto:${email}`}>{email}</a>
          </div>
        </div>

        <div className="ci">
          <div className="ci-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div>
            <h5>Address</h5>
            <span>{address}</span>
          </div>
        </div>

        <div className="ci">
          <div className="ci-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          </div>
          <div>
            <h5>Business Hours</h5>
            <span>Monday – Saturday · 10am – 7pm PKT</span>
          </div>
        </div>

        <div className="contact-social">
          <h5>Follow us</h5>
          <div className="contact-social-links">
            {SOCIAL_LINKS.map((link) => (
              <a key={link.id} href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="contact-quick-actions">
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-wa btn-wa-compact">
            Chat on WhatsApp
          </a>
          <a href={WEBSITE_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-wa-compact">
            Visit safvane.com
          </a>
        </div>
      </div>

      <div className="cr">
        <Reveal>
          <h3>Send us a message</h3>
          <p className="cr-sub">
            Fill out the form and our team will get back to you by email or WhatsApp.
          </p>
        </Reveal>
        <ContactForm defaultEmail={email} />
      </div>
    </div>
  );
}
