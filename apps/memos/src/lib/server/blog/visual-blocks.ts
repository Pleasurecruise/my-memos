import type { VisualBlock, VisualBlockType } from "$lib/types";

const VISUAL_LANGS = new Set<VisualBlockType>(["svg", "mermaid", "chart", "widget"]);

/** Placeholder HTML inserted where a visual block was extracted. */
function placeholderHtml(index: number): string {
  return `<div data-visual-block="${index}"></div>`;
}

/**
 * Scans markdown source for fenced code blocks with visual languages
 * (svg, mermaid, chart, widget). Extracts them and replaces each with
 * a placeholder <div> that can be targeted by the VisualBlocks component.
 *
 * Returns the modified markdown and the extracted visual blocks.
 */
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

    blocks.push({ type: lang as VisualBlockType, code: body.trim(), index: index++ });
    return placeholderHtml(index - 1);
  });

  return { markdown: processed, blocks };
}
