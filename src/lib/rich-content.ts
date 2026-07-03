/** True when content was saved from the rich text editor (HTML). */
export function looksLikeHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content.trim());
}

export function formatBenefitsForEditor(benefits?: string[]): string {
  if (!benefits?.length) return "";
  if (benefits.length === 1 && looksLikeHtml(benefits[0])) return benefits[0];
  return benefits.join("\n");
}

export function parseBenefitsField(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (looksLikeHtml(trimmed)) return [trimmed];
  return trimmed
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);
}

/** Escape text for safe HTML insertion when mixing editor HTML with generated lists. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function appendBenefitsToContent(description: string, benefits: string[]): string {
  if (!benefits.length) return description;

  if (benefits.length === 1 && looksLikeHtml(benefits[0])) {
    const base = description.trim();
    const extra = benefits[0].trim();
    if (!base) return extra;
    if (!extra) return base;
    return `${base}${extra}`;
  }

  if (looksLikeHtml(description)) {
    const items = benefits.map((b) => `<li>${escapeHtml(b)}</li>`).join("");
    const base = description.trim();
    return `${base}<h2>Key Benefits</h2><ul>${items}</ul>`;
  }

  const list = benefits.map((b) => `- ${b}`).join("\n");
  return `${description}\n\n## Key Benefits\n\n${list}`;
}
