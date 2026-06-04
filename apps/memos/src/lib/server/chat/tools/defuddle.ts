import { tool } from "ai";
import { z } from "zod";
import { Defuddle } from "defuddle/node";

export function createDefuddleTool() {
  return {
    fetch_url: tool({
      description:
        "Fetch a web page and extract clean markdown content. Use when the user provides a URL and wants to read or analyze it. Removes navigation, ads, and clutter. Do NOT use for URLs ending in .md — those are already markdown.",
      inputSchema: z.object({
        url: z.string().url().describe("The URL of the page to fetch and extract"),
      }),
      execute: async ({ url }) => {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Defuddle/1.0; +https://defuddle.md)",
          },
        });

        if (!response.ok) {
          return `Failed to fetch: ${response.status} ${response.statusText}`;
        }

        const html = await response.text();
        const result = await Defuddle(html, url, { markdown: true });

        if (!result.contentMarkdown && !result.content) {
          return `Could not extract content from ${url}. The page may be empty or require JavaScript.`;
        }

        const markdown = result.contentMarkdown || result.content;
        const header = [`Source: ${url}`, `Title: ${result.title || "Untitled"}`];

        if (result.description) header.push(`Description: ${result.description}`);
        if (result.author) header.push(`Author: ${result.author}`);
        if (result.published) header.push(`Published: ${result.published}`);

        return `${header.join("\n")}\n\n---\n\n${markdown}`;
      },
    }),
  };
}
