import { tool } from "ai";
import { z } from "zod";

const CTX7_BASE = "https://context7.com";

export function createContext7Tool() {
  return {
    lookup_docs: tool({
      description:
        "Look up up-to-date library documentation and code examples from Context7. " +
        "Use when the user asks about a specific library API, framework feature, or needs current documentation. " +
        "Provide the full library path (e.g., 'facebook/react', 'microsoft/typescript', 'vercel/next.js'). " +
        "Browse https://context7.com to discover available libraries.",
      inputSchema: z.object({
        library: z
          .string()
          .describe(
            "Library path in org/repo format (e.g., 'facebook/react', 'microsoft/typescript', 'sveltejs/kit'). Leading slash optional.",
          ),
        topic: z
          .string()
          .describe("Topic or API to look up (e.g., 'useState', 'routing', 'middleware')"),
      }),
      execute: async ({ library, topic }) => {
        const path = library.startsWith("/") ? library : `/${library}`;
        const url = `${CTX7_BASE}${path}/llms.txt?topic=${encodeURIComponent(topic)}`;

        const response = await fetch(url, {
          headers: { "User-Agent": "c7-cli/1.0.3" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            return `Library "${library}" not found on Context7. Check the path at ${CTX7_BASE}${path} or browse ${CTX7_BASE} to find the correct identifier.`;
          }
          return `Context7 returned ${response.status}: ${response.statusText}`;
        }

        const text = await response.text();

        if (!text.trim() || text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
          return `Library "${library}" not found on Context7. Visit ${CTX7_BASE} to find the correct library path.`;
        }

        return text;
      },
    }),
  };
}
