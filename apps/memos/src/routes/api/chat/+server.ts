import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from "ai";
import { createChatTools } from "$lib/server/chat/tools";

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized." }, { status: 401 });
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });

  const { messages } = (await request.json()) as { messages: UIMessage[] };

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
    apiKey: "",
    // apiKey: platform.env.OPENAI_API_KEY,
    headers: { "cf-aig-authorization": `Bearer ${platform.env.CF_AIG_TOKEN}` },
    fetch: (url, init) => {
      const headers = new Headers(init?.headers);
      headers.delete("authorization");
      const body = JSON.stringify({
        ...JSON.parse(init?.body as string),
        thinking: { type: "disabled" },
      });
      return globalThis.fetch(url, { ...init, headers, body });
    },
  });

  const result = streamText({
    // model: provider.chat(
    //   `custom-${platform.env.AI_GATEWAY_PROVIDER_SLUG}/deepseek-ai/DeepSeek-V4-Flash`,
    // ),
    model: provider.chat(`deepseek/deepseek-v4-flash`),
    system,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: createChatTools(platform.env),
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => (error instanceof Error ? error.message : String(error)),
  });
};
