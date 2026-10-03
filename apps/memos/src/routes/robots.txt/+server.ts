import { env } from "cloudflare:workers";
import { createRobotsText, discoveryResponse, siteOrigin } from "#lib/server/discovery/index.ts";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ url }) =>
  discoveryResponse(createRobotsText(siteOrigin(env, url)), "text/plain; charset=utf-8");
