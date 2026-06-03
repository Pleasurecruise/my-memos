import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import type { Root as MdastRoot, Text } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { TocEntry } from "$lib/types";
import { getHighlighter } from "./shiki";
import { rehypeToc } from "./rehype-toc";
import { rehypeTables } from "./rehype-tables";

export interface CompiledNote {
  html: string;
  toc: TocEntry[];
  excerpt: string;
}

const remarkExcerpt: Plugin<[{ segments: string[] }], MdastRoot> = (options) => (tree) => {
  visit(tree, (node) => {
    if (node.type === "yaml" || node.type === "code" || node.type === "html") return;
    if (node.type === "text") options.segments.push((node as Text).value);
  });
};

function markdownToHast() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw);
}

export async function compileMarkdown(source: string): Promise<CompiledNote> {
  const toc: TocEntry[] = [];
  const excerptSegments: string[] = [];
  const shouldHighlight = /(^|\n)```[^\s`\n]+/.test(source);

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkExcerpt, { segments: excerptSegments })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw);

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
    .use(rehypeStringify)
    .process(source);

  const excerpt = excerptSegments.join(" ").replace(/\s+/g, " ").trim();

  return { html: String(result), toc, excerpt };
}

export async function compileEditorHtml(source: string): Promise<string> {
  const result = await markdownToHast().use(rehypeStringify).process(source);

  return String(result);
}
