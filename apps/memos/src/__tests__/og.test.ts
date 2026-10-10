import { describe, expect, it } from "vite-plus/test";
import { renderOgImage } from "#lib/server/og/index.ts";

describe("Open Graph image", () => {
  it("lays the memo line and meta over the base image with escaped content", () => {
    const svg = renderOgImage({ line: "A memo <with> & details", meta: "2026年8月8日 · 思考" });

    expect(svg).toContain('width="1200" height="630"');
    expect(svg).toContain('href="data:image/jpeg;base64,');
    expect(svg).toContain(">A memo &lt;with&gt; &amp; details</text>");
    expect(svg).toContain(">2026年8月8日 · 思考</text>");
  });

  it("cuts a long memo to a single line instead of wrapping it", () => {
    const svg = renderOgImage({ line: "这是一段很长的正文".repeat(20), meta: "" });

    expect(svg.match(/<text/g)).toHaveLength(2);
    expect(svg).toContain(">这是一段很长的正文这是一段很长的…</text>");
  });
});
