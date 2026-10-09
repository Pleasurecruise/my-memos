import { describe, expect, it } from "vite-plus/test";
import {
  createLlmsText,
  createRobotsText,
  createRssFeed,
  createSitemap,
  memoSummary,
} from "#lib/server/discovery/index.ts";
import type { Memo } from "#lib/types.ts";

const origin = new URL("https://memos.example.com");

function memo(overrides: Partial<Memo> = {}): Memo {
  return {
    id: "20260801T120000Z-abcdef12",
    r2Key: "memos/20260801T120000Z-abcdef12.md",
    content: "# Hello & <world>\n\nA memo body. #design",
    tags: ["design"],
    createdAt: "2026-08-01T12:00:00.000Z",
    updatedAt: "2026-08-02T08:30:00.000Z",
    visibility: "public",
    pinned: false,
    favorite: false,
    archived: false,
    ...overrides,
  };
}

describe("crawler discovery", () => {
  it("allows public pages, blocks private paths, and links the sitemap", () => {
    const robots = createRobotsText(origin);

    expect(robots).toContain("User-agent: *\nAllow: /\n");
    expect(robots).toContain("Allow: /api/memos/*/og");
    expect(robots).toContain("Allow: /api/openapi.json");
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Disallow: /chat");
    expect(robots).toContain("Sitemap: https://memos.example.com/sitemap.xml");
  });

  it("lists the home page and memo permalinks with lastmod in the sitemap", () => {
    const sitemap = createSitemap([memo()], origin);

    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemap).toContain("<loc>https://memos.example.com/</loc>");
    expect(sitemap).toContain(
      "<loc>https://memos.example.com/memo/20260801T120000Z-abcdef12</loc>",
    );
    expect(sitemap).toContain("<lastmod>2026-08-02T08:30:00.000Z</lastmod>");
  });

  it("escapes memo text in the RSS feed", () => {
    const feed = createRssFeed([memo()], origin);

    expect(feed).toContain(
      '<atom:link href="https://memos.example.com/rss.xml" rel="self" type="application/rss+xml"/>',
    );
    expect(feed).toContain("<title>Hello &amp; world A memo body.</title>");
    expect(feed).toContain("<language>zh-CN</language>");
    expect(feed).toContain("<category>design</category>");
    expect(feed).toContain("<pubDate>Sat, 01 Aug 2026 12:00:00 GMT</pubDate>");
    expect(feed).not.toContain("<world>");
  });

  it("follows the llms.txt layout with escaped link titles", () => {
    const text = createLlmsText([memo({ content: "Notes on C:\\temp" })], origin);

    expect(text.startsWith("# My Memos\n\n> ")).toBe(true);
    expect(text).toContain("## Memos");
    expect(text).toContain("- [REST API](https://memos.example.com/api/openapi.json)");
    expect(text.indexOf("## API")).toBeLessThan(text.indexOf("## Memos"));
    expect(text).toContain(
      "- [Notes on C:\\\\temp](https://memos.example.com/memo/20260801T120000Z-abcdef12): Notes on C:\\temp (#design)",
    );
  });

  it("reports when there are no public memos", () => {
    expect(createLlmsText([], origin)).toContain("No public memos are available.");
  });

  it("truncates long summaries", () => {
    expect(memoSummary("a".repeat(200))).toBe(`${"a".repeat(160)}…`);
  });
});
