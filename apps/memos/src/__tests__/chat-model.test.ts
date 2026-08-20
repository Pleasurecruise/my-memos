import { describe, expect, it } from "vite-plus/test";
import { createChatProvider } from "$lib/server/chat/model";
import type { AppEnv } from "$lib/server/types";

describe("Cloudflare AI Gateway custom-provider BYOK model", () => {
  it("uses the custom-opencode endpoint without an upstream authorization header", () => {
    const provider = createChatProvider({
      CF_ACCOUNT_ID: "account/id",
      CF_AIG_TOKEN: "gateway-token",
    } as AppEnv);

    expect(provider.model).toEqual(
      expect.objectContaining({
        id: "deepseek-v4-flash",
        provider: "cloudflare-ai-gateway",
        baseUrl: "https://gateway.ai.cloudflare.com/v1/account%2Fid/default/custom-opencode/v1",
      }),
    );
    expect(provider.headers).toEqual({
      "cf-aig-authorization": "Bearer gateway-token",
      Authorization: null,
      "x-api-key": null,
    });
  });
});
