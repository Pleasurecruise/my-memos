import { env } from "cloudflare:workers";
import { isOwnerRequest } from "#lib/server/oauth.ts";
import { listTagDefinitions } from "#lib/server/tags/index.ts";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, locals }) => {
  if (!(await isOwnerRequest(request, locals.user))) {
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  return Response.json({ definitions: await listTagDefinitions(env.DB) });
};
