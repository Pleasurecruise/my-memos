import { Defuddle } from "defuddle/node";
import TurndownService from "turndown";
import { z } from "zod";
import {
  createMemo,
  deleteMemo,
  listAgentMemos,
  listTagCounts,
  memoDateSchema,
  memoSearchSchema,
  searchAgentMemos,
  updateMemo,
} from "$lib/server/memos";
import { renderChartSchema } from "$lib/visual/chart";
import { normalizeMermaidCode, renderMermaidSchema } from "$lib/visual/mermaid";
import { renderSvgSchema } from "$lib/visual/svg";
import { renderWidgetSchema } from "$lib/visual/widget";
import { DomainError } from "./errors";
import type { AppEnv } from "$lib/server/types";
import type { DomainOperation } from "./types";
import {
  cleanMarkdown,
  defineOperation,
  formatMemo,
  githubRead,
  publicHttpUrl,
  readLimitedText,
  requireOk,
} from "./utils";

export function createDomainOperations(env: AppEnv): DomainOperation[] {
  const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
  turndown.remove(["script", "style", "noscript", "nav", "footer", "iframe"]);

  return [
    defineOperation({
      name: "get_tags",
      description:
        "List all memo tags with counts. Call this before filtering by a user-provided tag.",
      schema: z.object({}),
      execute: async () => listTagCounts(env.DB, env.MEMOS_CACHE),
    }),
    defineOperation({
      name: "list_memos",
      description: "Browse memos by date range and tags without requiring keywords.",
      schema: z.object({
        from_date: memoDateSchema.optional(),
        to_date: memoDateSchema.optional(),
        tags: z.array(z.string()).optional(),
        limit: z.number().int().min(1).max(20).default(10),
      }),
      execute: async ({ from_date, to_date, tags, limit }) => {
        const memoResults = await listAgentMemos(env.DB, {
          fromDate: from_date,
          toDate: to_date,
          tags,
          limit,
        });
        return (
          memoResults.map((memo) => formatMemo(memo, memo.content)).join("\n\n---\n\n") ||
          "No memos found."
        );
      },
    }),
    defineOperation({
      name: "search_memos",
      description: "Search memo contents by keyword, optionally constrained by dates and tags.",
      schema: z.object({
        query: memoSearchSchema.refine((value) => value.length > 0, "Search cannot be empty."),
        from_date: memoDateSchema.optional(),
        to_date: memoDateSchema.optional(),
        tags: z.array(z.string()).optional(),
      }),
      execute: async ({ query, from_date, to_date, tags }) => {
        const memoResults = await searchAgentMemos(env.DB, env.MEMOS_BUCKET, {
          query,
          fromDate: from_date,
          toDate: to_date,
          tags,
          limit: 10,
        });
        return (
          memoResults.map((memo) => formatMemo(memo, memo.content)).join("\n\n---\n\n") ||
          "No memos found."
        );
      },
    }),
    defineOperation({
      name: "create_memo",
      description: "Create a memo. Tags are extracted from hashtags when omitted.",
      mutation: true,
      schema: z.object({
        content: z.string().min(1),
        tags: z.array(z.string()).default([]),
        visibility: z.enum(["private", "public"]).default("private"),
      }),
      execute: async (input) => createMemo(env.DB, env.MEMOS_BUCKET, env.MEMOS_CACHE, input),
    }),
    defineOperation({
      name: "update_memo",
      description: "Update an existing memo. Obtain its ID with list_memos or search_memos first.",
      mutation: true,
      schema: z.object({
        id: z.string(),
        content: z.string().optional(),
        tags: z.array(z.string()).optional(),
        visibility: z.enum(["private", "public"]).optional(),
        pinned: z.boolean().optional(),
        archived: z.boolean().optional(),
      }),
      execute: async ({ id, ...input }) => {
        if (Object.values(input).every((value) => value === undefined))
          throw new DomainError("invalid_input", "No changes specified.");
        return updateMemo(env.DB, env.MEMOS_BUCKET, env.MEMOS_CACHE, id, input);
      },
    }),
    defineOperation({
      name: "delete_memo",
      description: "Permanently delete a memo. Confirm with the user before calling.",
      mutation: true,
      schema: z.object({ id: z.string() }),
      execute: async ({ id }) => {
        await deleteMemo(env.DB, env.MEMOS_BUCKET, env.MEMOS_CACHE, id);
        return { id, deleted: true };
      },
    }),
    defineOperation({
      name: "web_search",
      description: "Search the web for up-to-date information.",
      schema: z.object({
        query: z.string().min(1),
        max_results: z.number().int().min(1).max(7).default(5),
      }),
      execute: async ({ query, max_results }, signal) => {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: env.TAVILY_API_KEY,
            query,
            max_results,
            include_answer: true,
          }),
          signal,
        });
        requireOk(response, "Tavily");
        return JSON.parse(await readLimitedText(response, "Tavily"));
      },
    }),
    defineOperation({
      name: "fetch_raw",
      description: "Fetch raw URL content; HTML is converted to Markdown.",
      schema: z.object({ url: publicHttpUrl }),
      execute: async ({ url }, signal) => {
        const response = await fetch(url, {
          headers: { "User-Agent": "my-memos/1.0" },
          redirect: "error",
          signal,
        });
        requireOk(response, "URL");
        const body = await readLimitedText(response, "URL");
        const type = response.headers.get("content-type") ?? "";
        if (type.includes("application/json")) return JSON.parse(body);
        return type.includes("text/html")
          ? cleanMarkdown(turndown.turndown(body))
          : cleanMarkdown(body);
      },
    }),
    defineOperation({
      name: "fetch_url",
      description: "Fetch a web page and extract clean Markdown with Defuddle.",
      schema: z.object({ url: publicHttpUrl }),
      execute: async ({ url }, signal) => {
        const response = await fetch(url, {
          headers: { "User-Agent": "Defuddle/1.0" },
          redirect: "error",
          signal,
        });
        requireOk(response, "URL");
        const result = await Defuddle(await readLimitedText(response, "URL"), url, {
          markdown: true,
        });
        const content = result.contentMarkdown || result.content;
        if (!content)
          throw new DomainError("upstream_failure", "No readable page content was found.");
        return {
          source: url,
          title: result.title || "Untitled",
          description: result.description,
          author: result.author,
          published: result.published,
          content,
        };
      },
    }),
    defineOperation({
      name: "github_read",
      description:
        "Read a GitHub repository, commit, pull request, issue, file, or tree from its URL.",
      schema: z.object({ url: publicHttpUrl }),
      execute: async ({ url }, signal) => githubRead(url, signal),
    }),
    defineOperation({
      name: "lookup_docs",
      description: "Look up current library documentation and examples from Context7.",
      schema: z.object({ library: z.string().min(1), topic: z.string().min(1) }),
      execute: async ({ library, topic }, signal) => {
        const path = library.startsWith("/") ? library : `/${library}`;
        const response = await fetch(
          `https://context7.com${path}/llms.txt?topic=${encodeURIComponent(topic)}`,
          { headers: { "User-Agent": "c7-cli/1.0.3" }, signal },
        );
        requireOk(response, "Context7");
        return readLimitedText(response, "Context7");
      },
    }),
    defineOperation({
      name: "render_chart",
      description:
        "Render a data chart only when the user requests one or a data pattern is materially clearer than a compact table.",
      schema: renderChartSchema,
      execute: async (input) => input,
    }),
    defineOperation({
      name: "render_svg",
      description: "Render a static SVG only when the user explicitly requests a visual.",
      schema: renderSvgSchema,
      execute: async (input) => input,
    }),
    defineOperation({
      name: "render_mermaid",
      description:
        "Render a compact Mermaid diagram for an explicit Mermaid request or a relationship or sequence that needs a diagram.",
      schema: renderMermaidSchema,
      execute: async (input) => {
        return { ...input, code: normalizeMermaidCode(input.code) };
      },
    }),
    defineOperation({
      name: "render_widget",
      description:
        "Render an interactive HTML widget only when the user asks to manipulate controls.",
      schema: renderWidgetSchema,
      execute: async (input) => input,
    }),
  ];
}
