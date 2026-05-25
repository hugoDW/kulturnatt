const SEPARATOR = "||";

export type DecodedTag = {
  name: string;
  image: string | null;
};

export function encodeTag(name: string, image?: string | null): string {
  const trimmed = name.trim();
  if (!image) return trimmed;
  return `${trimmed}${SEPARATOR}${image}`;
}

export function decodeTag(value: string): DecodedTag {
  const index = value.indexOf(SEPARATOR);
  if (index < 0) {
    return { name: value, image: null };
  }
  return {
    name: value.slice(0, index),
    image: value.slice(index + SEPARATOR.length) || null,
  };
}

export function decodeAll(values: string[] | null | undefined): DecodedTag[] {
  if (!Array.isArray(values)) return [];
  return values.map(decodeTag);
}

export function tagName(value: string): string {
  if (typeof value !== "string") return "";
  return decodeTag(value).name;
}

// Stable identity for a selectable item. A search can return several distinct
// records that share a display name (e.g. two different artists, or a song that
// exists on multiple albums), so the name alone is not a safe selection key.
// We pair the (normalized) name with the image — the only other field we
// persist — so selecting one record no longer highlights its namesakes.
export function tagKey(name: string, image?: string | null): string {
  return `${name.trim().toLowerCase()}::${image ?? ""}`;
}
