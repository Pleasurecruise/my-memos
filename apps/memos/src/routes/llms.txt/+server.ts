import { env } from "cloudflare:workers";
import { listPublicMemos } from "#lib/server/memos/index.ts";
import {
  DISCOVERY_MEMO_LIMIT,
  createLlmsText,
  discoveryResponse,
  siteOrigin,
} from "#lib/server/discovery/index.ts";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  const memos = await listPublicMemos(env.DB, DISCOVERY_MEMO_LIMIT);
  return discoveryResponse(
    createLlmsText(memos, siteOrigin(env, url)),
    "text/plain; charset=utf-8",
  );
};
