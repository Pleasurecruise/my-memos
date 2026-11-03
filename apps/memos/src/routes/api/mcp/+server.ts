import { env } from "cloudflare:workers";
import { createMcpProtectedRequestHandler } from "@better-auth/mcp";
import { createMemosMcpHandler } from "#lib/server/mcp/index.ts";
import { RESOURCE_SERVER } from "#lib/server/oauth.ts";
import type { RequestHandler } from "./$types";

const handleMcp = createMcpProtectedRequestHandler(RESOURCE_SERVER, (request) =>
  createMemosMcpHandler(env, "external").fetch(request),
);

export const POST: RequestHandler = async ({ request }) => {
  if (request.headers.has("mcp-session-id")) {
    return Response.json({ error: "MCP sessions are not supported." }, { status: 400 });
  }
  return handleMcp(request);
};
