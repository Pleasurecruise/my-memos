import type { AppEnv } from "#lib/server/types.ts";
import { stripMarkdown } from "#lib/server/og/index.ts";
import { SITE_DESCRIPTION, SITE_NAME } from "#lib/site.ts";
import type { Memo } from "#lib/types.ts";

export const DISCOVERY_MEMO_LIMIT = 5000;
const FEED_MEMO_LIMIT = 50;
const SUMMARY_LENGTH = 160;
const TITLE_LENGTH = 60;

const DISALLOWED_PATHS = ["/api/", "/archive", "/favorites", "/chat"];

export function siteOrigin(env: Pick<AppEnv, "BETTER_AUTH_URL">, fallback: URL): URL {
  return new URL(env.BETTER_AUTH_URL || fallback.origin);
}

export function memoUrl(origin: URL, id: string): string {
  return new URL(`/memo/${id}`, origin).href;
}

export function memoSummary(content: string): string {
  const plain = stripMarkdown(content);
  if (plain.length === 0) return `A memo from ${SITE_NAME}`;
  return plain.length > SUMMARY_LENGTH ? `${plain.slice(0, SUMMARY_LENGTH)}…` : plain;
}

export function memoTitle(content: string): string {
  return memoSummary(content).slice(0, TITLE_LENGTH);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function createRobotsText(origin: URL): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Allow: /api/memos/*/og",
    "Allow: /api/openapi.json",
    ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${new URL("/sitemap.xml", origin).href}`,
    "",
  ].join("\n");
}

export function createSitemap(memos: readonly Memo[], origin: URL): string {
  const entries = [
    { loc: new URL("/", origin).href, lastmod: memos.at(0)?.updatedAt },
    ...memos.map((memo) => ({ loc: memoUrl(origin, memo.id), lastmod: memo.updatedAt })),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) =>
      [
        "  <url>",
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        ...(entry.lastmod ? [`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`] : []),
        "  </url>",
      ].join("\n"),
    ),
    "</urlset>",
    "",
  ].join("\n");
}

export function createRssFeed(memos: readonly Memo[], origin: URL): string {
  const feedUrl = new URL("/rss.xml", origin).href;
  const homeUrl = new URL("/", origin).href;
  const recent = [...memos]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, FEED_MEMO_LIMIT);
  const lastBuildDate = memos.at(0)?.updatedAt;
  const items = recent.map((memo) => {
    const url = memoUrl(origin, memo.id);
    return [
      "    <item>",
      `      <title>${escapeXml(memoTitle(memo.content))}</title>`,
      `      <description>${escapeXml(memoSummary(memo.content))}</description>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `      <pubDate>${new Date(memo.createdAt).toUTCString()}</pubDate>`,
      ...memo.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
      "    </item>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(SITE_NAME)}</title>`,
    `    <description>${escapeXml(SITE_DESCRIPTION)}</description>`,
    `    <link>${escapeXml(homeUrl)}</link>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>`,
    "    <language>zh-CN</language>",
    ...(lastBuildDate
      ? [`    <lastBuildDate>${new Date(lastBuildDate).toUTCString()}</lastBuildDate>`]
      : []),
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

function escapeMarkdownLinkText(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]");
}

export function createLlmsText(memos: readonly Memo[], origin: URL): string {
  const links = memos.map((memo) => {
    const title = escapeMarkdownLinkText(memoTitle(memo.content));
    const tags = memo.tags.length > 0 ? ` (${memo.tags.map((tag) => `#${tag}`).join(" ")})` : "";
    return `- [${title}](${memoUrl(origin, memo.id)}): ${memoSummary(memo.content)}${tags}`;
  });

  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "This index lists only public memos, most recently updated first. Each memo page is canonical.",
    `An RSS feed of recent memos is available at ${new URL("/rss.xml", origin).href}.`,
    "",
    "## API",
    "",
    `- [REST API](${new URL("/api/openapi.json", origin).href}): ${new URL("/api", origin).href} for memos (list, search, read, write) and tags. Anonymous list reads return public memos; everything else requires \`Authorization: Bearer <API key>\` or the owner session.`,
    `- [MCP](${new URL("/api/mcp", origin).href}): Stateless MCP endpoint with the same Bearer key.`,
    "",
    "## Memos",
    "",
    ...(links.length > 0 ? links : ["No public memos are available."]),
    "",
  ].join("\n");
}

export function discoveryResponse(body: string, contentType: string): Response {
  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=3600",
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
