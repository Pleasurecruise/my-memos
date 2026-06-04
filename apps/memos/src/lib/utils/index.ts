import { goto } from "$app/navigation";

const HASH_TAG_RE =
  /(^|\s)#(?=[\p{Letter}\p{Number}_\-/]+(?:\s|$))(?!#)([\p{Letter}\p{Number}_\-/]+)/gu;

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

export function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const group = map.get(key);
    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

/** Compute the viewport (x,y) of the caret in a textarea. Used to position floating popups. */
export function getCaretScreenPosition(textarea: HTMLTextAreaElement): { x: number; y: number } {
  const mirror = document.createElement("div");
  const styles = getComputedStyle(textarea);
  const rect = textarea.getBoundingClientRect();

  // Mirror the textarea's text layout in an off-screen div
  mirror.style.cssText = `
    position:fixed; top:-9999px; left:0; visibility:hidden;
    width:${rect.width}px; min-height:${rect.height}px;
    font:${styles.font}; line-height:${styles.lineHeight};
    padding:${styles.padding}; border:${styles.border};
    white-space:pre-wrap; word-wrap:break-word;
    overflow-wrap:break-word; box-sizing:${styles.boxSizing};
    letter-spacing:${styles.letterSpacing};
  `;

  mirror.textContent = textarea.value.slice(0, textarea.selectionEnd);

  const marker = document.createElement("span");
  marker.textContent = "|";
  mirror.appendChild(marker);

  document.body.appendChild(mirror);
  const x = rect.left + marker.offsetLeft - textarea.scrollLeft;
  const y = rect.top + marker.offsetTop - textarea.scrollTop + parseFloat(styles.lineHeight);
  document.body.removeChild(mirror);

  return { x, y };
}
