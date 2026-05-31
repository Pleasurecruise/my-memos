export const BLOG_PREFIX = "blog/";

export function r2KeyFromSlug(slug: string): string {
  return `${BLOG_PREFIX}${slug}.md`;
}

export function slugFromR2Key(key: string): string {
  return key.slice(BLOG_PREFIX.length).replace(/\.md$/i, "");
}
