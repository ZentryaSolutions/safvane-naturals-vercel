export const BRAND = {
  name: "Safvane Naturals",
  tagline: "Pure Cold-Pressed Black Seed Oil",
  description:
    "100% natural kalonji oil — cold-pressed, chemical-free, crafted for wellness.",
} as const;

/** Public website — used on printed box labels (QR code) and links. */
export const WEBSITE_URL = "https://www.safvane.com";

export const CONTACT = {
  email: "info@safvane.com",
  phone: "+92 371 2456245",
  phoneDisplay: "+92 371 2456245",
  whatsapp: "923712456245",
  address: "Attock City, Pakistan",
  company: "Safvane Naturals Pvt. Ltd.",
  cuin: "0343184",
  ntn: "E811040",
} as const;

export const SOCIAL_LINKS = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/safvane.naturals/",
  },
  {
    id: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/SafvaneNaturals",
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@safvane.naturals",
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@safvane.naturals",
  },
] as const;

export const TRUST_BADGES = [
  { label: "100% Natural", icon: "leaf" },
  { label: "Cold Pressed", icon: "droplet" },
  { label: "Chemical Free", icon: "shield" },
] as const;

export const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/track-order", label: "Track Order" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const WHATSAPP_NUMBER = CONTACT.whatsapp;

export const WHATSAPP_DEFAULT_MESSAGE =
  "Hello Safvane Naturals, I'd like to know more about your products.";

export function getWhatsAppOrderMessage(
  productName: string,
  variantLabel: string,
  price: string,
  quantity = 1
) {
  return `Hello Safvane Naturals, I'd like to order:

*${productName}* — ${variantLabel}
Quantity: ${quantity}
Price: ${price}

Please confirm availability and COD delivery.`;
}

export const PRODUCT_IMAGE_GUIDE = {
  width: 1200,
  height: 1200,
  ratio: "1:1",
  formats: "JPG or PNG",
  tip: "Center the product on a clean white or transparent background with even padding.",
} as const;

export const MARKDOWN_HINT =
  "Markdown supported: ## headings, **bold**, bullet lists, [links](url), images ![alt](image-url), and tables.";

export const DEFAULT_DELIVERY_RETURNS = `## Delivery

Nationwide delivery across Pakistan with **cash on delivery** on all orders. Estimated **2–4 business days**. Major cities typically receive orders sooner.

## Returns

If your order arrives damaged or incorrect, contact us on WhatsApp within 48 hours and we'll arrange a full replacement at no extra cost.`;

export const HERO_BANNER_IMAGE = "/images/hero-black-seed-oil.png";

export const CART_STORAGE_KEY = "safvane-cart";
