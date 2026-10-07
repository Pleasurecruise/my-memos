import type { Nodes, PhrasingContent } from "mdast";
import { toHtml } from "hast-util-to-html";
import { fromMarkdown, type Options } from "mdast-util-from-markdown";
import { gfmFootnoteFromMarkdown } from "mdast-util-gfm-footnote";
import { gfmStrikethroughFromMarkdown } from "mdast-util-gfm-strikethrough";
import { gfmTableFromMarkdown } from "mdast-util-gfm-table";
import { gfmTaskListItemFromMarkdown } from "mdast-util-gfm-task-list-item";
import { toHast } from "mdast-util-to-hast";
import { gfmFootnote } from "micromark-extension-gfm-footnote";
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";
import { gfmTable } from "micromark-extension-gfm-table";
import { gfmTaskListItem } from "micromark-extension-gfm-task-list-item";

const PARSE_OPTIONS: Options = {
  extensions: [gfmTable(), gfmFootnote(), gfmStrikethrough(), gfmTaskListItem()],
  mdastExtensions: [
    gfmTableFromMarkdown(),
    gfmFootnoteFromMarkdown(),
    gfmStrikethroughFromMarkdown(),
    gfmTaskListItemFromMarkdown(),
  ],
};
const PROTECTED_TYPES = new Set([
  "blockquote",
  "link",
  "linkReference",
  "image",
  "imageReference",
  "strong",
  "emphasis",
  "delete",
]);
const URL_RE = /[A-Za-z][A-Za-z0-9+.-]*:\/\/[^\s<>]+/g;
const TRAILING_PUNCTUATION = ".,:;!?'\"*_~";
const BRACKETS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

function safeDestination(destination: string, allowMailto: boolean): boolean {
  const colon = destination.indexOf(":");
  if (colon === -1) return true;
  const delimiter = destination.search(/[/?#]/);
  if (delimiter !== -1 && delimiter < colon) return true;
  const scheme = destination.slice(0, colon).toLowerCase();
  return scheme === "http" || scheme === "https" || (allowMailto && scheme === "mailto");
}

function separateListContinuations(source: string): string {
  const insertions: number[] = [];
  let separated = false;

  function visit(node: Nodes, listDepth: number, protectedDepth: number) {
    if (node.type === "listItem") separated = false;
    if (node.type === "text" && listDepth > 0 && protectedDepth === 0 && !separated) {
      const end = node.position?.end.offset ?? 0;
      let index = source.indexOf("\n", node.position?.start.offset);
      while (index !== -1 && index < end && !separated) {
        if (/\S/.test(source[index + 1] ?? "")) {
          insertions.push(index + 1);
          separated = true;
        }
        index = source.indexOf("\n", index + 1);
      }
      return;
    }
    if (!("children" in node)) return;
    const nextListDepth = listDepth + (node.type === "list" ? 1 : 0);
    const nextProtectedDepth = protectedDepth + (PROTECTED_TYPES.has(node.type) ? 1 : 0);
    for (const child of node.children) visit(child, nextListDepth, nextProtectedDepth);
  }

  visit(fromMarkdown(source, PARSE_OPTIONS), 0, 0);
  let output = source;
  for (const offset of insertions.reverse()) {
    output = `${output.slice(0, offset)}\n${output.slice(offset)}`;
  }
  return output;
}

function normalize(node: Nodes, linked: boolean) {
  if (node.type === "link" || node.type === "definition") {
    if (!safeDestination(node.url, true)) node.url = "#";
  } else if (node.type === "image") {
    if (!safeDestination(node.url, false)) node.url = "";
  }
  if (!("children" in node)) return;
  const insideLink = linked || node.type === "link" || node.type === "linkReference";
  const children: Nodes[] = [];
  for (const child of node.children as Nodes[]) {
    if (child.type === "html") {
      children.push({ type: "text", value: child.value });
      continue;
    }
    if (child.type !== "text") {
      normalize(child, insideLink);
      children.push(child);
      continue;
    }
    const phrasing: PhrasingContent[] = [];
    child.value.split("\n").forEach((line, index) => {
      if (index > 0) phrasing.push({ type: "break" });
      let cursor = 0;
      for (const match of insideLink ? [] : line.matchAll(URL_RE)) {
        let url = match[0];
        while (url) {
          const last = url.at(-1)!;
          const opening = BRACKETS[last];
          const unbalanced =
            opening !== undefined && url.split(opening).length < url.split(last).length;
          if (!TRAILING_PUNCTUATION.includes(last) && !unbalanced) break;
          url = url.slice(0, -1);
        }
        if (url.endsWith("://") || !safeDestination(url, true)) continue;
        if (match.index > cursor) {
          phrasing.push({ type: "text", value: line.slice(cursor, match.index) });
        }
        phrasing.push({ type: "link", url, children: [{ type: "text", value: url }] });
        cursor = match.index + url.length;
      }
      if (cursor < line.length) phrasing.push({ type: "text", value: line.slice(cursor) });
    });
    children.push(...phrasing);
  }
  (node as { children: Nodes[] }).children = children;
}

export function renderMarkdown(source: string): string {
  const tree = fromMarkdown(
    separateListContinuations(source.replace(/\r\n?/g, "\n")),
    PARSE_OPTIONS,
  );
  normalize(tree, false);
  return toHtml(toHast(tree));
}
