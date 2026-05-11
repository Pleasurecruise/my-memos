import { goto } from "$app/navigation";

export function updateQuery(params: Record<string, string | undefined>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  goto(`${url.pathname}?${url.searchParams.toString()}`, { keepFocus: true, noScroll: true });
}
