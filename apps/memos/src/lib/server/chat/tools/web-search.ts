import { tool } from "ai";
import { z } from "zod";

export function createWebSearchTool(tavilyApiKey: string) {
  return {
    web_search: tool({
      description:
        "Search the web for up-to-date information. Use when the user asks about current events, facts, or anything not likely to be in their memos.",
      inputSchema: z.object({
        query: z.string().describe("Search query"),
        max_results: z
          .number()
          .int()
          .min(1)
          .max(10)
          .default(5)
          .describe("Number of results to return (default 5)"),
      }),
      execute: async ({ query, max_results }) => {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query,
            max_results,
            include_answer: true,
          }),
        });
        const data = (await res.json()) as {
          answer?: string;
          results: { title: string; url: string; content: string }[];
        };

        const parts: string[] = [];
        if (data.answer) parts.push(`Summary: ${data.answer}`);
        parts.push(...data.results.map((r) => `[${r.title}](${r.url})\n${r.content}`));
        return parts.join("\n\n---\n\n") || "No results found.";
      },
    }),
  };
}
