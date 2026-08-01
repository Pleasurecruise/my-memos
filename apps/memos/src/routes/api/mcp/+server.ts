import { json } from "@sveltejs/kit";
import { verifyMcpApiKey, createMemosMcpHandler } from "$lib/server/mcp";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, platform }) => {
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });
  if (request.headers.has("mcp-session-id")) {
    return json({ error: "MCP sessions are not supported." }, { status: 400 });
  }
  if (!(await verifyMcpApiKey(request, platform.env.MCP_API_KEY))) {
    return json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  return createMemosMcpHandler(platform.env, "api-key").fetch(request);
};
