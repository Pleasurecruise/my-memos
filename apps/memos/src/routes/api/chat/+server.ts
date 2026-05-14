import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs, type ModelMessage } from "ai";
import { z } from "zod";

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

  const systemParts = [promptMd || "You are a helpful personal assistant."];
  if (memoryMd) systemParts.push(`\n\n<memory>\n${memoryMd}\n</memory>`);
  const system = systemParts.join("");

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
      search_memos: tool({
        description:
          "Search through personal memos to find relevant information. Use this when the user asks about past notes, events, or anything that might be recorded.",
        inputSchema: z.object({
          query: z.string().describe("Keywords to search for in memos"),
        }),
        execute: async ({ query }) => {
          const { results } = await platform.env.DB.prepare(
            `SELECT id, r2_key, excerpt, tags_json, created_at
             FROM memos
             WHERE archived = 0 AND excerpt LIKE ?
             ORDER BY created_at DESC
             LIMIT 5`,
          )
            .bind(`%${query}%`)
            .all<{
              id: string;
              r2_key: string;
              excerpt: string;
              tags_json: string;
              created_at: string;
            }>();

          if (!results?.length) return "No memos found.";

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
        for await (const chunk of result.textStream) {
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
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
