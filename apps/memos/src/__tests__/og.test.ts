import { describe, expect, it } from "vite-plus/test";
import { renderOgImage } from "$lib/server/og";

describe("Open Graph image", () => {
  it("renders the branded memo card with escaped content", () => {
    const svg = renderOgImage({
      title: "A memo <with> & details",
      tags: ["design", "思考"],
      domain: "memos.example.com",
      date: "2026年8月8日",
    });

    expect(svg).toContain('width="1200" height="630"');
    expect(svg).toContain("A memo &lt;with&gt; &amp; details");
    expect(svg).toContain("MY MEMOS");
    expect(svg).toContain("PERSONAL MEMO");
    expect(svg).toContain("MEMOS.EXAMPLE.COM");
    expect(svg).toContain("2026年8月8日");
    expect(svg).toContain("#design");
    expect(svg).toContain("#思考");
    expect(svg).toContain('href="data:image/png;base64,');
    expect(svg).toContain('clip-path="url(#site-mark-clip)"');
    expect(svg).toContain('fill="#963c5a"');
    expect(svg).toContain('fill="#faf7eb"');
    expect(svg).not.toContain('rx="15"');
    expect(svg).not.toContain('transform="rotate');
    expect(svg).not.toContain("radialGradient");
    expect(svg).not.toContain("<pattern");
  });

  it("limits long titles to four balanced lines", () => {
    const svg = renderOgImage({ title: "这是一段很长的标题".repeat(20) });
    const titleLines = svg.match(/<text[^>]*font-size="46"[^>]*>.*?<\/text>/g) ?? [];

    expect(titleLines).toHaveLength(4);
    expect(titleLines.at(-1)).toContain("…");
  });

  it("gives short memo titles a stronger editorial scale", () => {
    const svg = renderOgImage({ title: "慢慢记录生活" });

    expect(svg).toContain('font-size="64"');
  });
});
