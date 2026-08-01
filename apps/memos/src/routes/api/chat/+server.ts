import { json } from "@sveltejs/kit";
import { connectMcp, runAgent, type McpConnection, type McpFetch } from "@my-memos/ai-core";
import { chatRequestSchema } from "$lib/chat/protocol";
import type { ChatEvent } from "$lib/chat/types";
import { createMemosMcpHandler } from "$lib/server/mcp";
import { createChatProvider } from "$lib/server/chat/model";
import { GENERATIVE_UI_PROMPT } from "$lib/server/chat/prompt";
import { loadPromptMemory } from "$lib/server/chat/prompt-cache";
import { AgentChatStreamBridge, latestUserTurn, uiMessagesToPi } from "$lib/server/chat/bridge";
import { updateMemoryAfterChat } from "$lib/server/chat/memory";
import { chatErrorText } from "$lib/server/chat/utils";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized." }, { status: 401 });
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });

  const body: unknown = await request.json().catch(() => null);
  const validation = chatRequestSchema.safeParse(body);
  if (!validation.success) {
    return json({ error: "Invalid chat transcript." }, { status: 400 });
  }
  const requestMessages = validation.data.messages;
  const latestUser = latestUserTurn(requestMessages);
  const { prompt, memory } = await loadPromptMemory(platform.env.MEMOS_BUCKET);
  const today = new Date().toISOString().slice(0, 10);
  const system = [
    `Today's date (UTC): ${today}`,
    prompt || "You are a helpful personal assistant.",
    memory ? `<memory>\n${memory}\n</memory>` : "",
    GENERATIVE_UI_PROMPT,
  ]
    .filter(Boolean)
    .join("\n\n");

  const provider = createChatProvider(platform.env);

  const encoder = new TextEncoder();
  const abort = new AbortController();
  const signal = AbortSignal.any([request.signal, abort.signal]);
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (event: ChatEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      void (async () => {
        let mcp: McpConnection | undefined;
        const bridge = new AgentChatStreamBridge(write);
        const mcpServer = createMemosMcpHandler(platform.env, "user");
        try {
          const inProcessFetch: McpFetch = async (input, init) => {
            const mcpSignal = init?.signal ? AbortSignal.any([signal, init.signal]) : signal;
            return mcpServer.fetch(new Request(input, { ...init, signal: mcpSignal }));
          };
          mcp = await connectMcp({ url: "https://mcp.internal/api/mcp", fetch: inProcessFetch });
          await runAgent({
            systemPrompt: system,
            model: provider.model,
            messages: uiMessagesToPi(requestMessages, provider.model.id),
            tools: mcp.tools,
            headers: provider.headers,
            signal,
            onEvent: (event) => bridge.write(event),
          });
          write({ type: "finish" });
          if (!signal.aborted && latestUser && bridge.assistantText.trim()) {
            platform.ctx.waitUntil(
              updateMemoryAfterChat(
                platform.env,
                latestUser.id,
                latestUser.text,
                bridge.assistantText.trim(),
              ),
            );
          }
        } catch (error) {
          if (!cancelled && !signal.aborted) {
            write({ type: "error", message: chatErrorText(error) });
          }
        } finally {
          await Promise.allSettled([mcp?.close(), mcpServer.close()]);
          if (!cancelled) controller.close();
        }
      })();
    },
    cancel() {
      cancelled = true;
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
