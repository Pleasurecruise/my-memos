const HASH_TAG_RE =
  /(^|\s)#(?=[\p{Letter}\p{Number}_\-/]+(?:\s|$))(?!#)([\p{Letter}\p{Number}_\-/]+)/gu;

export function extractTags(text: string): string[] {
  const tags = (text.match(HASH_TAG_RE) ?? []).map((match) => match.trim().slice(1).toLowerCase());
  return [...new Set(tags)].slice(0, 24);
}

const TRAILING_HASH_TAGS_RE = /(?:\s+#[\p{Letter}\p{Number}_\-/]+)+\s*$/u;

export function replaceTrailingHashtags(text: string, tags: string[]): string {
  const body = text.replace(TRAILING_HASH_TAGS_RE, "").trimEnd();
  return tags.length > 0 ? `${body}\n\n${tags.map((tag) => `#${tag}`).join(" ")}` : body;
}

export function stripHashtags(text: string): string {
  return text
    .replace(HASH_TAG_RE, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
