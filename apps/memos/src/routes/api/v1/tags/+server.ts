import { verifyApiKey } from "$lib/server/apikey";
import { listTagCounts } from "$lib/server/memos";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, platform }) => {
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });
  if (!(await verifyApiKey(request, platform.env.API_KEY))) {
    return json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  return json({ tags: await listTagCounts(platform.env.DB) });
};
