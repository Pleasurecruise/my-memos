import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { UIMessage } from "ai";
import { createProvider } from "$lib/server/chat/provider";
import { executeAutoDream } from "$lib/server/chat/auto-dream";

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized." }, { status: 401 });
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });

  const { messages } = (await request.json()) as { messages: UIMessage[] };
  if (!messages?.length) return json({ ok: true });

  const memoryObj = await platform.env.MEMOS_BUCKET.get("agent/MEMORY.md");
  const currentMemory = memoryObj ? await memoryObj.text() : "";

  const provider = createProvider(platform.env);
  // const slug = platform.env.CF_CUSTOM_PROVIDER_SLUG;

  await executeAutoDream({
    bucket: platform.env.MEMOS_BUCKET,
    model: provider.chat(`deepseek/deepseek-v4-flash`),
    // model: provider.chat(`custom-${slug}/deepseek-v4-flash`),
    currentMemory,
    messages,
  });

  return json({ ok: true });
};
