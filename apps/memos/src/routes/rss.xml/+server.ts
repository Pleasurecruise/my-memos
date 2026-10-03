import { env } from "cloudflare:workers";
import { listPublicMemos } from "#lib/server/memos/index.ts";
import {
  DISCOVERY_MEMO_LIMIT,
  createRssFeed,
  discoveryResponse,
  siteOrigin,
} from "#lib/server/discovery/index.ts";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  const memos = await listPublicMemos(env.DB, DISCOVERY_MEMO_LIMIT);
  return discoveryResponse(
    createRssFeed(memos, siteOrigin(env, url)),
    "application/rss+xml; charset=utf-8",
  );
};
