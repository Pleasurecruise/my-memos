import { env } from "cloudflare:workers";
import { createMemosMcpHandler } from "#lib/server/mcp/index.ts";
import { verifyApiKey } from "#lib/server/apikey/index.ts";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  if (request.headers.has("mcp-session-id")) {
    return Response.json({ error: "MCP sessions are not supported." }, { status: 400 });
  }
  if (!(await verifyApiKey(request, env.API_KEY))) {
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  return createMemosMcpHandler(env, "api-key").fetch(request);
};
