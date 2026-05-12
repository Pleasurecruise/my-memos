import { goto } from "$app/navigation";

type QueryValue = string | string[] | null;

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

export function stripHashtags(text: string): string {
  return text
    .replace(
      /(^|\s)#(?=[\p{Letter}\p{Number}_\-/]+(?:\s|$))(?!#)([\p{Letter}\p{Number}_\-/]+)/gu,
      "$1",
    )
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
