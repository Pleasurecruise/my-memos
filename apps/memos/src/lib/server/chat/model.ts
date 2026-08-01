import { createOpenAICompatibleModel } from "@my-memos/ai-core";
import type { AppEnv } from "$lib/server/types";
import type { ChatProvider } from "./types";

export function createChatProvider(env: AppEnv): ChatProvider {
  return {
    model: createOpenAICompatibleModel({
      id: "deepseek-chat",
      provider: "cloudflare-ai-gateway",
      baseUrl: `https://gateway.ai.cloudflare.com/v1/${encodeURIComponent(env.CF_ACCOUNT_ID)}/default/deepseek`,
    }),
    headers: {
      "cf-aig-authorization": `Bearer ${env.CF_AIG_TOKEN}`,
      Authorization: null,
      "x-api-key": null,
    },
  };
}
