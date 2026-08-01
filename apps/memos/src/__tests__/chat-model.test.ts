import { describe, expect, it } from "vitest";
import { createChatProvider } from "$lib/server/chat/model";
import type { AppEnv } from "$lib/server/types";

describe("Cloudflare AI Gateway BYOK model", () => {
  it("uses the provider-native endpoint without an upstream authorization header", () => {
    const provider = createChatProvider({
      CF_ACCOUNT_ID: "account/id",
      CF_AIG_TOKEN: "gateway-token",
    } as AppEnv);

    expect(provider.model).toEqual(
      expect.objectContaining({
        id: "deepseek-chat",
        provider: "cloudflare-ai-gateway",
        baseUrl: "https://gateway.ai.cloudflare.com/v1/account%2Fid/default/deepseek",
      }),
    );
    expect(provider.headers).toEqual({
      "cf-aig-authorization": "Bearer gateway-token",
      Authorization: null,
      "x-api-key": null,
    });
  });
});
