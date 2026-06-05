import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import type { Code, InlineCode, Root as MdastRoot, Text } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { TocEntry, VisualBlock } from "$lib/types";
import { decode } from "entities";
import { extractVisualBlocks } from "./visual-blocks";
import { getHighlighter } from "./shiki";
import { rehypeToc } from "./rehype-toc";
import { rehypeTables } from "./rehype-tables";

export interface CompiledNote {
  html: string;
  toc: TocEntry[];
  excerpt: string;
  visualBlocks: VisualBlock[];
}

const remarkExcerpt: Plugin<[{ segments: string[] }], MdastRoot> = (options) => (tree) => {
  visit(tree, (node) => {
    if (node.type === "yaml" || node.type === "code" || node.type === "html") return;
    if (node.type === "text") options.segments.push((node as Text).value);
  });
};

const remarkDecodeCodeEntities: Plugin<[], MdastRoot> = () => (tree) => {
  visit(tree, ["code", "inlineCode"], (node) => {
    const codeNode = node as Code | InlineCode;
    codeNode.value = decode(codeNode.value).replace(/\n+$/, "");
  });
};

function markdownToHast() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDecodeCodeEntities)
    .use(remarkRehype, { allowDangerousHtml: true });
}

export async function compileMarkdown(source: string): Promise<CompiledNote> {
  const toc: TocEntry[] = [];
  const excerptSegments: string[] = [];

  // Extract visual blocks before compiling so fenced code with visual
  // languages (svg, mermaid, chart, widget) are not syntax-highlighted.
  const { markdown: processedSource, blocks: visualBlocks } = extractVisualBlocks(source);
  const shouldHighlight = /(^|\n)```[^\s`\n]+/.test(processedSource);

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDecodeCodeEntities)
    .use(remarkExcerpt, { segments: excerptSegments })
    .use(remarkRehype, { allowDangerousHtml: true });

  if (shouldHighlight) {
    const highlighter = await getHighlighter();
    processor.use(() =>
      rehypeShikiFromHighlighter(highlighter, {
        themes: { light: "github-light", dark: "github-dark" },
        lazy: true,
        defaultLanguage: "text",
        fallbackLanguage: "text",
        transformers: [
          {
            pre(node) {
              const lang = this.options.lang ?? "";
              if (lang && lang !== "text") node.properties["data-language"] = lang;
            },
          },
        ],
      }),
    );
  }

  const result = await processor
    .use(rehypeToc, { toc })
    .use(rehypeTables)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(processedSource);

  const html = String(result);

  const excerpt = excerptSegments.join(" ").replace(/\s+/g, " ").trim();

  return { html, toc, excerpt, visualBlocks };
}

export async function compileEditorHtml(source: string): Promise<string> {
  const result = await markdownToHast()
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(source);

  return String(result);
}
