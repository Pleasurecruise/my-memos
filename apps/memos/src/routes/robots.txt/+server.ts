import { createRobotsText, discoveryResponse, siteOrigin } from "#lib/server/discovery/index.ts";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = () =>
  discoveryResponse(createRobotsText(siteOrigin()), "text/plain; charset=utf-8");
