import { describe, expect, it, vi } from "vite-plus/test";
import { createChatProvider } from "#lib/server/chat/model.ts";

vi.mock("#env", () => ({
  default: { CF_ACCOUNT_ID: "account/id", CF_AIG_TOKEN: "gateway-token" },
}));

describe("Cloudflare AI Gateway custom-provider BYOK model", () => {
  it("uses the custom-opencode endpoint with a conversation session and no upstream authorization", () => {
    const provider = createChatProvider("conversation-id");

    expect(provider.model).toEqual(
      expect.objectContaining({
        id: "deepseek-v4.1-flash",
        provider: "cloudflare-ai-gateway",
        baseUrl: "https://gateway.ai.cloudflare.com/v1/account%2Fid/default/custom-opencode/v1",
      }),
    );
    expect(provider.headers).toEqual({
      "cf-aig-authorization": "Bearer gateway-token",
      Authorization: null,
      "x-api-key": null,
      "x-opencode-session": "conversation-id",
    });
  });
});
