import { tool } from "ai";
import { z } from "zod";
import TurndownService from "turndown";

/**
 * Clean up turndown output: collapse excessive blank lines, strip trailing whitespace.
 */
function cleanMarkdown(md: string, maxLen = 12_000): string {
  let text = md
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/gm, "")
    .trim();

  if (text.length > maxLen) {
    text = text.slice(0, maxLen) + `\n\n[...truncated, total ${text.length} chars]`;
  }

  return text;
}

export function createFetchRawTool() {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    emDelimiter: "_",
    bulletListMarker: "-",
  });

  // Strip elements that produce noise
  turndown.remove(["script", "style", "noscript", "nav", "footer", "iframe"]);

  return {
    fetch_raw: tool({
      description:
        "Fetch the raw content of any URL. Use for URLs that are not standard articles (e.g., GitHub commits, API responses, text files, pastebins). " +
        "For article / documentation pages, prefer fetch_url (Defuddle) which produces cleaner markdown. " +
        "This tool converts HTML to markdown via turndown.",
      inputSchema: z.object({
        url: z.string().url().describe("The URL to fetch"),
      }),
      execute: async ({ url }) => {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; my-memos/1.0; +https://memos.you-find.me)",
          },
        });

        const contentType = response.headers.get("content-type") || "";
        const status = `${response.status} ${response.statusText}`;

        if (!response.ok) {
          return `HTTP ${status}`;
        }

        const body = await response.text();

        let content: string;
        if (contentType.includes("application/json")) {
          content = JSON.stringify(JSON.parse(body), null, 2);
        } else if (
          contentType.includes("text/html") ||
          contentType.includes("text/plain") ||
          !contentType
        ) {
          content = cleanMarkdown(turndown.turndown(body));
        } else {
          content = `[${contentType.split(";")[0]} content, ${body.length} bytes — cannot display inline]`;
        }

        const header = [
          `URL: ${url}`,
          `Status: ${status}`,
          `Content-Type: ${contentType || "unknown"}`,
          `Size: ${body.length} bytes`,
        ];

        if (contentType.includes("text/html")) {
          const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (titleMatch) header.push(`Title: ${titleMatch[1].trim()}`);
        }

        return `${header.join("\n")}\n\n---\n\n${content}`;
      },
    }),
  };
}
