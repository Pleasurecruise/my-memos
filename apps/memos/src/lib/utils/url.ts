export function normalizeUrlPathSegment(value: string): string {
  return value
    .trim()
    .replace(/\.md$/i, "")
    .replace(/[\\/?#:[\]@!$&'()*+,;=]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Return the first slash-delimited segment of a note slug (its category). */
export function categoryFromSlug(slug: string): string | undefined {
  return slug.split("/").filter(Boolean).at(0);
}

export function encodeSlug(slug: string): string {
  return slug.replace(/\.md$/i, "").split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

export const DEFAULT_NOTE_CATEGORY = "未分类类别";

export function normalizeNoteSlug(rawSlug: string): string {
  return rawSlug
    .replace(/\.md$/i, "")
    .split("/")
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");
}
