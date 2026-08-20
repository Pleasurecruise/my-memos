import type { Tool } from "@modelcontextprotocol/client";
import { describe, expect, it, vi } from "vite-plus/test";
import type { McpToolClient } from "../types";
import { toPiTool } from "../mcp";

const schema = { type: "object" as const, properties: { value: { type: "string" } } };

function mcpTool(name: string, readOnlyHint = true): Tool {
  return {
    name,
    description: `${name} description`,
    inputSchema: schema,
    annotations: { readOnlyHint },
  };
}

describe("MCP to pi tool adapter", () => {
  it("uses MCP annotations for sequential writes and parallel reads", () => {
    const client = { callTool: vi.fn() } as McpToolClient;
    expect(toPiTool(client, mcpTool("create_memo", false)).executionMode).toBe("sequential");
    expect(toPiTool(client, mcpTool("search_memos")).executionMode).toBe("parallel");
  });

  it("propagates cancellation and structured output", async () => {
    const callTool = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "done" }],
      structuredContent: { ok: true },
    });
    const client = { callTool } as McpToolClient;
    const tool = toPiTool(client, mcpTool("search_memos"));
    const controller = new AbortController();
    const result = await tool.execute("call-1", { value: "x" }, controller.signal);

    expect(callTool).toHaveBeenCalledWith(
      { name: "search_memos", arguments: { value: "x" } },
      expect.objectContaining({ signal: controller.signal }),
    );
    expect(result.details).toEqual({ ok: true });
  });

  it("turns MCP error results into thrown tool failures", async () => {
    const client = {
      callTool: vi.fn().mockResolvedValue({
        isError: true,
        content: [{ type: "text", text: "not_found: missing" }],
      }),
    } as McpToolClient;
    const tool = toPiTool(client, mcpTool("search_memos"));
    await expect(tool.execute("call-1", {}, new AbortController().signal)).rejects.toThrow(
      "not_found: missing",
    );
  });
});
