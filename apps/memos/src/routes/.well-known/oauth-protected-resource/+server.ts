import { PROTECTED_RESOURCE_METADATA } from "#lib/server/oauth.ts";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = () =>
  Response.json(PROTECTED_RESOURCE_METADATA, {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=3600" },
  });
