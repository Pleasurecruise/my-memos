import type { VisualBlock } from "$lib/types";

export type ArticleVisualPart =
  | { type: "html"; html: string }
  | { type: "visual"; block: VisualBlock };

const VISUAL_BLOCK_MARKER_PATTERN = /<meta data-vb="(\d+)">/g;

export function splitVisualBlockHtml(html: string, blocks: VisualBlock[]): ArticleVisualPart[] {
  const blockByIndex = new Map(blocks.map((block) => [block.index, block]));
  const parts: ArticleVisualPart[] = [];
  let lastHtmlIndex = 0;
  let matchedBlockCount = 0;
  let marker: RegExpExecArray | null;

  VISUAL_BLOCK_MARKER_PATTERN.lastIndex = 0;
  while ((marker = VISUAL_BLOCK_MARKER_PATTERN.exec(html)) !== null) {
    if (marker.index > lastHtmlIndex) {
      parts.push({ type: "html", html: html.slice(lastHtmlIndex, marker.index) });
    }

    const block = blockByIndex.get(Number(marker[1]));
    if (block) {
      parts.push({ type: "visual", block });
      matchedBlockCount += 1;
    }
    lastHtmlIndex = VISUAL_BLOCK_MARKER_PATTERN.lastIndex;
  }

  if (lastHtmlIndex < html.length) {
    parts.push({ type: "html", html: html.slice(lastHtmlIndex) });
  }

  if (matchedBlockCount === 0 && blocks.length > 0) {
    console.warn(
      `splitVisualBlockHtml: ${blocks.length} visual block(s) present but no markers found in HTML. Appending at end.`,
    );
    return [{ type: "html", html }, ...blocks.map((block) => ({ type: "visual" as const, block }))];
  }

  return parts;
}
