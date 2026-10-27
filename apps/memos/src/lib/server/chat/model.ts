import { createOpenAICompatibleModel } from "@my-memos/ai-core";
import env from "#env";
import type { ChatProvider } from "./types";

export function createChatProvider(sessionId: string): ChatProvider {
  return {
    model: createOpenAICompatibleModel({
      id: "deepseek-v4.1-flash",
      provider: "cloudflare-ai-gateway",
      baseUrl: `https://gateway.ai.cloudflare.com/v1/${encodeURIComponent(env.CF_ACCOUNT_ID)}/default/custom-opencode/v1`,
    }),
    headers: {
      "cf-aig-authorization": `Bearer ${env.CF_AIG_TOKEN}`,
      Authorization: null,
      "x-api-key": null,
      "x-opencode-session": sessionId,
    },
  };
}
