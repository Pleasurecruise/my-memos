import { describe, expect, it } from "vite-plus/test";
import { renderMarkdown } from "#lib/utils/markdown.ts";

describe("memo markdown", () => {
  it("ends a list at an unindented continuation line", () => {
    expect(renderMarkdown("- 第一项\n接着写的一行\n- 第二项")).toBe(
      "<ul>\n<li>第一项</li>\n</ul>\n<p>接着写的一行</p>\n<ul>\n<li>第二项</li>\n</ul>",
    );
    expect(renderMarkdown("- a\n- b\n总结一下")).toContain("</ul>\n<p>总结一下</p>");
    expect(renderMarkdown("- 第一项\n  缩进续行")).toBe(
      "<ul>\n<li>第一项<br>\n缩进续行</li>\n</ul>",
    );
    expect(renderMarkdown("- **粗体\n跨行**")).toBe(
      "<ul>\n<li><strong>粗体<br>\n跨行</strong></li>\n</ul>",
    );
  });

  it("renders soft breaks as line breaks and supports footnotes", () => {
    expect(renderMarkdown("第一行\n第二行")).toBe("<p>第一行<br>\n第二行</p>");
    const html = renderMarkdown("正文[^1]\n\n[^1]: 注释");
    expect(html).toContain("data-footnote-ref");
    expect(html).toContain("注释");
  });

  it("escapes raw HTML and neutralizes unsafe destinations", () => {
    expect(renderMarkdown("hello <b>bold</b>")).toBe("<p>hello &#x3C;b>bold&#x3C;/b></p>");
    expect(renderMarkdown("[x](javascript:alert(1))")).toBe('<p><a href="#">x</a></p>');
    expect(renderMarkdown("![i](javascript:1)")).toBe('<p><img src="" alt="i"></p>');
    expect(renderMarkdown("javascript://%0aalert(1)")).not.toContain("<a");
  });

  it("links bare URLs outside code and links only", () => {
    expect(renderMarkdown("see https://a.com/x. and www.b.com")).toBe(
      '<p>see <a href="https://a.com/x">https://a.com/x</a>. and www.b.com</p>',
    );
    expect(renderMarkdown("`https://x.com`")).toBe("<p><code>https://x.com</code></p>");
  });
});
