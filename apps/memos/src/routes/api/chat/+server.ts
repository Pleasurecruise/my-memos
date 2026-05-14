import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs, type ModelMessage } from "ai";
import { z } from "zod";

type MemoRow = {
  id: string;
  r2_key: string;
  excerpt: string;
  tags_json: string;
  created_at: string;
};

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized." }, { status: 401 });
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });

  const { messages } = (await request.json()) as { messages: ModelMessage[] };

  const [promptObj, memoryObj] = await Promise.all([
    platform.env.MEMOS_BUCKET.get("agent/PROMPT.md"),
    platform.env.MEMOS_BUCKET.get("agent/MEMORY.md"),
  ]);

  const promptMd = promptObj ? await promptObj.text() : "";
  const memoryMd = memoryObj ? await memoryObj.text() : "";

  const today = new Date().toISOString().slice(0, 10);
  let system = `Today's date (UTC): ${today}\n\n${promptMd || "You are a helpful personal assistant."}`;
  if (memoryMd) system += `\n\n<memory>\n${memoryMd}\n</memory>`;

  const gatewayBase = `https://gateway.ai.cloudflare.com/v1/${platform.env.CF_ACCOUNT_ID}/${platform.env.CF_GATEWAY_NAME}/compat`;
  const provider = createOpenAI({
    baseURL: gatewayBase,
    apiKey: platform.env.OPENAI_API_KEY,
    headers: { "cf-aig-authorization": `Bearer ${platform.env.CF_AIG_TOKEN}` },
  });

  const result = streamText({
    model: provider.chat(
      `custom-${platform.env.AI_GATEWAY_PROVIDER_SLUG}/deepseek-ai/DeepSeek-V4-Flash`,
    ),
    system,
    messages,
    stopWhen: stepCountIs(5),
    tools: {
      get_tags: tool({
        description:
          "List all tags the user has used, with memo counts. Call this first whenever the user mentions tags or wants to filter by a tag — so you know the exact tag names before filtering.",
        inputSchema: z.object({}),
        execute: async () => {
          const { results } = await platform.env.DB.prepare(
            `SELECT lower(json_each.value) AS name, COUNT(*) AS count
             FROM memos, json_each(memos.tags_json)
             WHERE archived = 0
             GROUP BY lower(json_each.value)
             ORDER BY count DESC, name ASC`,
          ).all<{ name: string; count: number }>();

          if (!results.length) return "No tags found.";
          return results.map((r) => `${r.name} (${r.count})`).join(", ");
        },
      }),

      list_memos: tool({
        description:
          "Browse memos by time range and/or tags without needing keywords. Use for temporal questions ('最近', '今天', '上周', '这个月', '3月份') or tag-based browsing. Returns excerpts. When the user mentions a tag, call get_tags first to confirm the exact name.",
        inputSchema: z.object({
          from_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe("Start date (YYYY-MM-DD), inclusive"),
          to_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe("End date (YYYY-MM-DD), inclusive"),
          tags: z
            .array(z.string())
            .optional()
            .describe("Filter by these tags (case-insensitive, all must match)"),
          limit: z
            .number()
            .int()
            .min(1)
            .max(20)
            .default(10)
            .describe("Number of memos to return (default 10)"),
        }),
        execute: async ({ from_date, to_date, tags, limit }) => {
          const conditions = ["archived = 0"];
          const bindings: (string | number)[] = [];

          if (from_date) {
            conditions.push("substr(created_at, 1, 10) >= ?");
            bindings.push(from_date);
          }
          if (to_date) {
            conditions.push("substr(created_at, 1, 10) <= ?");
            bindings.push(to_date);
          }
          if (tags?.length) {
            for (const tag of tags) {
              conditions.push(
                "EXISTS (SELECT 1 FROM json_each(memos.tags_json) WHERE lower(json_each.value) = lower(?))",
              );
              bindings.push(tag);
            }
          }
          bindings.push(limit);

          const { results } = await platform.env.DB.prepare(
            `SELECT id, r2_key, excerpt, tags_json, created_at
             FROM memos
             WHERE ${conditions.join(" AND ")}
             ORDER BY created_at DESC
             LIMIT ?`,
          )
            .bind(...bindings)
            .all<MemoRow>();

          if (!results.length) return "No memos found.";

          return results
            .map((row) => {
              const tags = (JSON.parse(row.tags_json) as string[]).join(", ") || "none";
              return `[${row.created_at.slice(0, 10)}] tags: ${tags}\n${row.excerpt}`;
            })
            .join("\n\n---\n\n");
        },
      }),

      search_memos: tool({
        description:
          "Search memos by keyword. Use when the user asks about a specific topic, person, or event. Returns full memo content. Combine with from_date/to_date for time-scoped searches, or tags to narrow down further. For pure time/tag browsing without keywords, use list_memos instead.",
        inputSchema: z.object({
          query: z.string().describe("Keywords to search for in memo content"),
          from_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe("Start date (YYYY-MM-DD), inclusive"),
          to_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe("End date (YYYY-MM-DD), inclusive"),
          tags: z
            .array(z.string())
            .optional()
            .describe("Also filter by these tags (case-insensitive)"),
        }),
        execute: async ({ query, from_date, to_date, tags }) => {
          const conditions = ["archived = 0", "excerpt LIKE ?"];
          const bindings: (string | number)[] = [`%${query}%`];

          if (from_date) {
            conditions.push("substr(created_at, 1, 10) >= ?");
            bindings.push(from_date);
          }
          if (to_date) {
            conditions.push("substr(created_at, 1, 10) <= ?");
            bindings.push(to_date);
          }
          if (tags?.length) {
            for (const tag of tags) {
              conditions.push(
                "EXISTS (SELECT 1 FROM json_each(memos.tags_json) WHERE lower(json_each.value) = lower(?))",
              );
              bindings.push(tag);
            }
          }

          const { results } = await platform.env.DB.prepare(
            `SELECT id, r2_key, excerpt, tags_json, created_at
             FROM memos
             WHERE ${conditions.join(" AND ")}
             ORDER BY created_at DESC
             LIMIT 10`,
          )
            .bind(...bindings)
            .all<MemoRow>();

          if (!results.length) return "No memos found.";

          const items = await Promise.all(
            results.map(async (row) => {
              const obj = await platform.env.MEMOS_BUCKET.get(row.r2_key);
              const content = obj ? await obj.text() : row.excerpt;
              const tags = (JSON.parse(row.tags_json) as string[]).join(", ") || "none";
              return `[${row.created_at.slice(0, 10)}] tags: ${tags}\n${content}`;
            }),
          );

          return items.join("\n\n---\n\n");
        },
      }),

      update_memory: tool({
        description:
          "Overwrite the long-term memory file with updated information about the user. Call this when you learn something worth remembering across conversations.",
        inputSchema: z.object({
          content: z.string().describe("Full new markdown content for the memory file"),
        }),
        execute: async ({ content }) => {
          await platform.env.MEMOS_BUCKET.put("agent/MEMORY.md", content, {
            httpMetadata: { contentType: "text/markdown; charset=utf-8" },
          });
          return "Memory updated.";
        },
      }),
    },
  });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ text: part.text })}\n\n`));
          } else if (part.type === "tool-call") {
            controller.enqueue(
              enc.encode(`data: ${JSON.stringify({ tool_call: part.toolName })}\n\n`),
            );
          } else if (part.type === "error") {
            const msg = part.error instanceof Error ? part.error.message : String(part.error);
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          }
        }
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
