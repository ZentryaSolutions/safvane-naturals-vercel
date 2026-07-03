import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatPrice(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString("en-PK")}`;
}

export function getLowestVariantPrice(
  variants: { price: number }[]
): number | null {
  if (variants.length === 0) return null;
  return Math.min(...variants.map((v) => Number(v.price)));
}

export function validatePakistaniPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  const patterns = [
    /^03\d{9}$/,
    /^\+923\d{9}$/,
    /^923\d{9}$/,
    /^0\d{10}$/,
  ];
  return patterns.some((p) => p.test(cleaned));
}

export function normalizePakistaniPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+92")) return cleaned;
  if (cleaned.startsWith("92")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+92${cleaned.slice(1)}`;
  return cleaned;
}

export function getWhatsAppLink(
  phone: string,
  message?: string
): string {
  const normalized = phone.replace(/[^\d]/g, "");
  const base = `https://wa.me/${normalized}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23e8e4dc' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%238b9a7d' font-family='sans-serif' font-size='16'%3ESafvane Naturals%3C/text%3E%3C/svg%3E";
