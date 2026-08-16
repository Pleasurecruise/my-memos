import { createMcpHandler, McpServer, type McpHttpHandler } from "@modelcontextprotocol/server";
import { createDomainOperations } from "./operations";
import { normalizeDomainError } from "./errors";
import type { AppEnv } from "$lib/server/types";
import type { McpPrincipal } from "./types";

const INTERNAL_ONLY_TOOLS = new Set([
  "github_read",
  "update_memory",
  "render_chart",
  "render_svg",
  "render_mermaid",
  "render_widget",
]);

export function createMemosMcpHandler(env: AppEnv, principal: McpPrincipal): McpHttpHandler {
  return createMcpHandler(
    () => {
      const server = new McpServer(
        { name: "my-memos", version: "1.0.0" },
        { capabilities: { tools: {} } },
      );

      const operations = createDomainOperations(env).filter(
        ({ name }) => principal === "user" || !INTERNAL_ONLY_TOOLS.has(name),
      );
      for (const operation of operations) {
        server.registerTool(
          operation.name,
          {
            description: operation.description,
            inputSchema: operation.schema,
            annotations: {
              readOnlyHint: !operation.mutation,
              destructiveHint: operation.name === "delete_memo",
            },
          },
          async (input, ctx) => {
            try {
              const value = await operation.execute(input, ctx.mcpReq.signal);
              return {
                content: [
                  {
                    type: "text" as const,
                    text: typeof value === "string" ? value : JSON.stringify(value),
                  },
                ],
                structuredContent: value,
                _meta: { principal },
              };
            } catch (error) {
              const normalized = normalizeDomainError(error);
              console.error("[mcp] tool failed", {
                tool: operation.name,
                principal,
                code: normalized.code,
              });
              return {
                isError: true,
                content: [
                  { type: "text" as const, text: `${normalized.code}: ${normalized.message}` },
                ],
                structuredContent: {
                  error: { code: normalized.code, message: normalized.message },
                },
              };
            }
          },
        );
      }
      return server;
    },
    { legacy: "stateless", responseMode: "auto" },
  );
}
