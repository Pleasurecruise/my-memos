export function extractTitle(source: string): string {
  const match = source.match(/^# (.+)$/m);
  return match ? match[1].trim() : "";
}

export function slugToTitle(slug: string): string {
  const segments = slug.split("/");
  const last = segments[segments.length - 1];
  return last
    .replace(/\.md$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
