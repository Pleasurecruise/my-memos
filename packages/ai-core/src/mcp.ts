import {
  Client,
  StreamableHTTPClientTransport,
  type Tool as McpTool,
} from "@modelcontextprotocol/client";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type, type TSchema } from "@earendil-works/pi-ai";
import type { ConnectMcpOptions, McpConnection, McpToolClient } from "./types";
import { toAgentToolResult } from "./utils";

export const MCP_PROTOCOL_VERSION = "2026-07-28";

export function toPiTool(client: McpToolClient, tool: McpTool): AgentTool {
  return {
    name: tool.name,
    label: tool.title ?? tool.name,
    description: tool.description ?? "",
    parameters: Type.Unsafe(tool.inputSchema as TSchema),
    executionMode: tool.annotations?.readOnlyHint === false ? "sequential" : "parallel",
    execute: async (_toolCallId, params, signal) => {
      const result = await client.callTool(
        { name: tool.name, arguments: params as Record<string, unknown> },
        { signal, toolDefinition: tool },
      );
      const mapped = toAgentToolResult(result);
      if (result.isError) {
        throw new Error(
          mapped.content.map((part) => (part.type === "text" ? part.text : "[image]")).join("\n"),
        );
      }
      return mapped;
    },
  };
}

export async function connectMcp({
  url,
  fetch,
  headers,
}: ConnectMcpOptions): Promise<McpConnection> {
  const client = new Client(
    { name: "ai-core", version: "1.0.0" },
    { versionNegotiation: { mode: { pin: MCP_PROTOCOL_VERSION } } },
  );
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    fetch,
    requestInit: headers ? { headers } : undefined,
  });

  try {
    await client.connect(transport);
    if (client.getProtocolEra() !== "modern") {
      throw new Error(`MCP server did not negotiate ${MCP_PROTOCOL_VERSION}.`);
    }

    const { tools } = await client.listTools();
    return {
      client,
      tools: tools.map((tool) => toPiTool(client, tool)),
      close: () => client.close(),
    };
  } catch (error) {
    await client.close().catch(() => undefined);
    throw error;
  }
}
