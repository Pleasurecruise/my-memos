import { describe, expect, it } from "vite-plus/test";
import { verifyMcpApiKey } from "$lib/server/mcp/auth";

describe("MCP fixed API key", () => {
  it("accepts only the configured bearer value", async () => {
    const valid = new Request("https://example.test/api/mcp", {
      headers: { authorization: "Bearer secret-value" },
    });
    const invalid = new Request("https://example.test/api/mcp", {
      headers: { authorization: "Bearer secret-valuF" },
    });

    await expect(verifyMcpApiKey(valid, "secret-value")).resolves.toBe(true);
    await expect(verifyMcpApiKey(invalid, "secret-value")).resolves.toBe(false);
    await expect(verifyMcpApiKey(valid, undefined)).resolves.toBe(false);
  });
});
