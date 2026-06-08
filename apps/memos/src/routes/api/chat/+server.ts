import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { R2Bucket } from "@cloudflare/workers-types";
import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from "ai";
import { createProvider } from "$lib/server/chat/provider";
import { createChatTools } from "$lib/server/chat/tools";
import { GENERATIVE_UI_PROMPT } from "$lib/server/chat/prompt";

let cachedPrompt: { prompt: string; memory: string } | null = null;

async function loadPromptMemory(bucket: R2Bucket): Promise<{ prompt: string; memory: string }> {
  if (cachedPrompt) return cachedPrompt;
  const [promptObj, memoryObj] = await Promise.all([
    bucket.get("agent/PROMPT.md"),
    bucket.get("agent/MEMORY.md"),
  ]);
  const prompt = promptObj ? await promptObj.text() : "";
  const memory = memoryObj ? await memoryObj.text() : "";
  cachedPrompt = { prompt, memory };
  return cachedPrompt;
}

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized." }, { status: 401 });
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });

  const { messages: requestMessages } = (await request.json()) as { messages: UIMessage[] };

  const { prompt: promptMd, memory: memoryMd } = await loadPromptMemory(platform.env.MEMOS_BUCKET);

  const today = new Date().toISOString().slice(0, 10);
  let system = `Today's date (UTC): ${today}\n\n${promptMd || "You are a helpful personal assistant."}`;
  if (memoryMd) system += `\n\n<memory>\n${memoryMd}\n</memory>`;
  system += `\n\n${GENERATIVE_UI_PROMPT}`;

  const provider = createProvider(platform.env);
  // const slug = platform.env.CF_CUSTOM_PROVIDER_SLUG;

  const result = streamText({
    model: provider.chat(`deepseek/deepseek-v4-flash`),
    // model: provider.chat(`custom-${slug}/deepseek-v4-flash`),
    system,
    messages: await convertToModelMessages(requestMessages),
    stopWhen: stepCountIs(20),
    tools: createChatTools(platform.env),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: requestMessages,
    onError: (error) => (error instanceof Error ? error.message : String(error)),
  });
};
