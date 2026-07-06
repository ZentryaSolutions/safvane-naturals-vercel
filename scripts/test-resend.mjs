import { readFileSync } from "fs";
import { Resend } from "resend";

function loadEnv() {
  const raw = readFileSync(".env.local", "utf8");
  const vars = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    vars[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return vars;
}

const to = process.argv[2];
if (!to) {
  console.error("Usage: node scripts/test-resend.mjs your@email.com");
  process.exit(1);
}

const env = loadEnv();
const apiKey = env.RESEND_API_KEY;
const from = env.RESEND_FROM_EMAIL ?? "orders@safvane.com";

if (!apiKey) {
  console.error("RESEND_API_KEY missing in .env.local");
  process.exit(1);
}

const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from: `Safvane Naturals <${from}>`,
  to,
  subject: "Safvane local test — Resend is working",
  text: "If you received this, local Resend setup is correct. You can now test checkout.",
});

if (error) {
  console.error("Failed:", error);
  process.exit(1);
}

console.log("Sent! Resend id:", data?.id);
console.log("From:", from, "→ To:", to);
console.log("Check inbox and spam. Then test checkout at http://localhost:3000/shop");
