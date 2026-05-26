type SocialMediaValue = {
  instagram?: string;
  facebook?: string;
};

export type SocialLink = {
  handle: string;
  url: string;
};

export type FacebookLink = {
  label: string;
  url: string;
};

function parseStoredSocialMedia(
  value: string | null | undefined,
): SocialMediaValue {
  if (!value) return {};

  const trimmed = value.trim();
  if (!trimmed) return {};

  try {
    const parsed = JSON.parse(trimmed);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return {
        instagram:
          typeof parsed.instagram === "string" ? parsed.instagram : undefined,
        facebook:
          typeof parsed.facebook === "string" ? parsed.facebook : undefined,
      };
    }
  } catch {
    // Legacy values were stored as a plain Instagram handle or URL.
  }

  return { instagram: trimmed };
}

export function getLegacySocialMediaInputs(value: string | null | undefined) {
  const parsed = parseStoredSocialMedia(value);

  return {
    instagram: parsed.instagram ?? "",
    facebook: parsed.facebook ?? "",
  };
}

export function parseInstagram(
  value: string | null | undefined,
): SocialLink | null {
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
    .replace(/^(www\.)?instagram\.com\//i, "")
    .replace(/\/+$/, "");

  if (!handle) return null;

  return { handle: `@${handle}`, url: `https://instagram.com/${handle}` };
}

export function parseFacebook(
  value: string | null | undefined,
): FacebookLink | null {
  const facebook = value?.trim();

  if (!facebook) return null;

  const url = /^https?:\/\//i.test(facebook)
    ? facebook
    : /^(?:www\.)?(?:facebook|fb)\.com\//i.test(facebook)
      ? `https://${facebook.replace(/^\/+/, "")}`
      : `https://facebook.com/${facebook.replace(/^@/, "").replace(/^\/+/, "")}`;
  const urlPath = url.match(/^(?:https?:\/\/)?(?:www\.)?(?:facebook|fb)\.com\/([^?#]+)/i)?.[1];
  const label = (urlPath ?? url)
    .replace(/^@/, "")
    .replace(/\/+$/, "");

  return {
    label,
    url,
  };
}
