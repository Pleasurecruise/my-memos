export function stripLeadingTitleHeading(source: string): string {
  return source.replace(/^\uFEFF?#\s+[^\r\n]+(?:\r?\n|$)/, "").replace(/^\r?\n/, "");
}

export function slugToTitle(slug: string): string {
  const segments = slug.split("/");
  const last = segments[segments.length - 1];
  return last
    .replace(/\.md$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
