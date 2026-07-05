import { CONTACT } from "@/lib/constants";

export const ABOUT_STORY = [
  `Safvane Naturals Pvt. Ltd. was founded with a clear purpose: to bring honest, high-quality natural oils to families across Pakistan — without hype, shortcuts, or hidden ingredients.`,
  `Incorporated under CUIN ${CONTACT.cuin} and based in ${CONTACT.address}, we produce in small, controlled batches so every bottle meets the same standard of purity, freshness, and transparency.`,
  `Our signature cold-pressed black seed (kalonji) oil is 100% natural — unrefined, chemical-free, and free from additives or synthetic fillers. What you read on the label is exactly what goes into every bottle.`,
  `From seed selection and cold pressing to amber-glass bottling and nationwide delivery, we oversee each step. Orders ship across Pakistan with cash on delivery, so you pay only when your parcel arrives.`,
  `Safvane Naturals is more than a product — it is our commitment to natural wellness made in Pakistan, for Pakistan.`,
] as const;

export const ABOUT_COMMITMENTS = [
  {
    title: "Cold-pressed & unrefined",
    text: "Slow-pressed without heat to preserve natural nutrients, aroma, and potency.",
  },
  {
    title: "No hidden ingredients",
    text: "No preservatives, fillers, artificial colours, or synthetic additives — ever.",
  },
  {
    title: "Batch traceability",
    text: "Every bottle carries batch details so you know exactly what you are using.",
  },
  {
    title: "Honest labelling",
    text: "Clear ingredient lists, usage guidance, and manufacturing information on every pack.",
  },
] as const;

export const COMPANY_FACTS = [
  { label: "Legal name", value: CONTACT.company },
  { label: "CUIN", value: CONTACT.cuin },
  { label: "Head office", value: CONTACT.address },
  { label: "Payment", value: "Cash on Delivery (COD) nationwide" },
  { label: "Delivery", value: "2–4 business days across Pakistan" },
  { label: "Support", value: `${CONTACT.email} · ${CONTACT.phoneDisplay}` },
] as const;
