import { env } from "cloudflare:workers";
import { isOwnerRequest } from "#lib/server/apikey/index.ts";
import { listTagDefinitions } from "#lib/server/tags/index.ts";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, locals }) => {
  if (!(await isOwnerRequest(request, locals.user, env.API_KEY))) {
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  return Response.json({ definitions: await listTagDefinitions(env.DB) });
};
