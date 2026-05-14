import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createWorkersAI } from "workers-ai-provider";
import { streamText, type ModelMessage } from "ai";

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized." }, { status: 401 });
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });

  const { messages } = (await request.json()) as { messages: ModelMessage[] };

  const workersai = createWorkersAI({ binding: platform.env.AI });

  const result = streamText({
    model: workersai("@cf/meta/llama-4-scout-17b-16e-instruct"),
    system: "You are a helpful personal assistant.",
    messages,
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
