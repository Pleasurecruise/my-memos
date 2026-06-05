import type { VisualBlock, VisualBlockType } from "$lib/types";
import { normalizeMermaidCode } from "$lib/visual/mermaid";

const VISUAL_LANGS = new Set<VisualBlockType>(["svg", "mermaid", "chart", "widget"]);

/** Extracts visual code blocks from markdown, replacing them with placeholders. */
export function extractVisualBlocks(source: string): {
  markdown: string;
  blocks: VisualBlock[];
} {
  const blocks: VisualBlock[] = [];
  let index = 0;

  const fenceRegex = /^( {0,3})(`{3,}|~{3,})\s*(\S*)[^\n]*\n([\s\S]*?)\n?\1\2\s*$/gm;

  const processed = source.replace(fenceRegex, (match, indent, fence, info, body) => {
    const lang = info.toLowerCase();
    if (!VISUAL_LANGS.has(lang as VisualBlockType)) return match;

    const code = lang === "mermaid" ? normalizeMermaidCode(body) : body.trim();
    blocks.push({ type: lang as VisualBlockType, code, index: index++ });
    return `<meta data-vb="${index - 1}">`;
  });

  return { markdown: processed, blocks };
}
