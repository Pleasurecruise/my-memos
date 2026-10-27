import { env } from "cloudflare:workers";
import { listPublicMemos } from "#lib/server/memos/index.ts";
import {
  DISCOVERY_MEMO_LIMIT,
  createSitemap,
  discoveryResponse,
  siteOrigin,
} from "#lib/server/discovery/index.ts";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  const memos = await listPublicMemos(env.DB, DISCOVERY_MEMO_LIMIT);
  return discoveryResponse(createSitemap(memos, siteOrigin()), "application/xml; charset=utf-8");
};
