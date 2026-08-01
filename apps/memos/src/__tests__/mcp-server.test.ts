import { connectMcp, MCP_PROTOCOL_VERSION } from "@my-memos/ai-core";
import type { McpHttpHandler } from "@modelcontextprotocol/server";
import { afterEach, describe, expect, it } from "vitest";
import { createDomainOperations } from "$lib/server/mcp/operations";
import { createMemosMcpHandler } from "$lib/server/mcp/server";
import type { AppEnv } from "$lib/server/types";

const EXTERNAL_TOOLS = [
  "create_memo",
  "delete_memo",
  "fetch_raw",
  "fetch_url",
  "get_tags",
  "github_read",
  "list_memos",
  "lookup_docs",
  "search_memos",
  "update_memo",
  "web_search",
];

const IN_PRODUCT_TOOLS = [
  ...EXTERNAL_TOOLS,
  "render_chart",
  "render_mermaid",
  "render_svg",
  "render_widget",
].sort();

function fakeEnv(): AppEnv {
  return {
    DB: {} as D1Database,
    MEMOS_BUCKET: {} as R2Bucket,
    MEMOS_CACHE: {} as KVNamespace,
    BETTER_AUTH_SECRET: "",
    BETTER_AUTH_URL: "",
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    ALLOWED_EMAIL: "",
    CF_ACCOUNT_ID: "",
    CF_AIG_TOKEN: "",
    MCP_API_KEY: "",
    TAVILY_API_KEY: "",
  };
}

describe("MCP 2026-07-28 contract", () => {
  const handlers: McpHttpHandler[] = [];
  afterEach(async () => Promise.all(handlers.splice(0).map((handler) => handler.close())));

  it("pins modern discovery and exposes every stable tool schema", async () => {
    const handler = createMemosMcpHandler(fakeEnv(), "user");
    handlers.push(handler);
    const connection = await connectMcp({
      url: "https://mcp.test/api/mcp",
      fetch: (input, init) => handler.fetch(new Request(input, init)),
    });

    expect(connection.client.getProtocolEra()).toBe("modern");
    expect(connection.client.getServerVersion()?.name).toBe("my-memos");
    expect(connection.tools.map((tool) => tool.name).sort()).toEqual(IN_PRODUCT_TOOLS);
    expect(
      connection.tools.every((tool) => (tool.parameters as { type?: unknown }).type === "object"),
    ).toBe(true);
    await connection.close();
  });

  it("does not expose in-product render tools to API-key clients", async () => {
    const handler = createMemosMcpHandler(fakeEnv(), "api-key");
    handlers.push(handler);
    const connection = await connectMcp({
      url: "https://mcp.test/api/mcp",
      fetch: (input, init) => handler.fetch(new Request(input, init)),
    });

    expect(connection.tools.map((tool) => tool.name).sort()).toEqual(EXTERNAL_TOOLS);
    await connection.close();
  });

  it("rejects a legacy initialize handshake", async () => {
    const handler = createMemosMcpHandler(fakeEnv(), "api-key");
    handlers.push(handler);
    const response = await handler.fetch(
      new Request("https://mcp.test/api/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-11-25",
            capabilities: {},
            clientInfo: { name: "old", version: "1" },
          },
        }),
      }),
    );
    expect(await response.text()).toContain(MCP_PROTOCOL_VERSION);
  });

  it("rejects private-network URLs before a fetch tool can run", async () => {
    const operations = createDomainOperations(fakeEnv());
    for (const name of ["fetch_raw", "fetch_url", "github_read"]) {
      const operation = operations.find((candidate) => candidate.name === name)!;
      expect(operation.schema.safeParse({ url: "http://127.0.0.1/admin" }).success).toBe(false);
      expect(operation.schema.safeParse({ url: "https://example.com/page" }).success).toBe(true);
      await expect(
        operation.execute(
          { url: "http://169.254.169.254/latest/meta-data" },
          new AbortController().signal,
        ),
      ).rejects.toThrow("public host");
    }
  });
});
