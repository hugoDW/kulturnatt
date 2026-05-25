// Normalizes whatever a user typed for their Instagram — a bare handle
// (`name` or `@name`), `instagram.com/name`, or a full `https://...` URL —
// into a display label and an openable URL.
export type InstagramLink = {
  handle: string;
  url: string;
};

export function parseInstagram(
  value: string | null | undefined,
): InstagramLink | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    const match = trimmed.match(/instagram\.com\/([^/?#]+)/i);
    const handle = match ? match[1] : "";
    return { handle: handle ? `@${handle}` : trimmed, url: trimmed };
  }

  const handle = trimmed
    .replace(/^@/, "")
    .replace(/^(www\.)?instagram\.com\//i, "");

  if (!handle) return null;

  return { handle: `@${handle}`, url: `https://instagram.com/${handle}` };
}
