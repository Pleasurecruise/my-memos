import { goto } from "$app/navigation";

type QueryValue = string | string[] | null;
const HASH_TAG_RE =
  /(^|\s)#(?=[\p{Letter}\p{Number}_\-/]+(?:\s|$))(?!#)([\p{Letter}\p{Number}_\-/]+)/gu;

export function updateQuery(params: Record<string, QueryValue>): void {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value === null || (Array.isArray(value) && value.length === 0)) {
      url.searchParams.delete(key);
    } else if (Array.isArray(value)) {
      url.searchParams.set(key, value.join(","));
    } else {
      url.searchParams.set(key, value);
    }
  }
  goto(`${url.pathname}?${url.searchParams.toString()}`, { keepFocus: true, noScroll: true });
}

export function extractTags(text: string): string[] {
  const matches = text.match(HASH_TAG_RE) ?? [];
  const tags = matches.map((m) => m.trim().slice(1).toLowerCase());
  return [...new Set(tags)].slice(0, 24);
}

export function stripHashtags(text: string): string {
  return text
    .replace(HASH_TAG_RE, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
