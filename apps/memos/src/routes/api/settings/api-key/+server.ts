import { generateApiKey, getApiKeyStatus } from "$lib/server/apikey";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export const GET: RequestHandler = async ({ locals, platform }) => {
  if (!locals.user) return json({ error: "Unauthorized." }, { status: 401 });
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });

  return json(await getApiKeyStatus(platform.env.API_KEY), {
    headers: NO_STORE_HEADERS,
  });
};

export const POST: RequestHandler = async ({ locals, platform }) => {
  if (!locals.user) return json({ error: "Unauthorized." }, { status: 401 });
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });

  const status = await getApiKeyStatus(platform.env.API_KEY);
  if (status.configured) {
    return json({ error: "API key already exists." }, { status: 409, headers: NO_STORE_HEADERS });
  }

  return json(await generateApiKey(platform.env.API_KEY), { headers: NO_STORE_HEADERS });
};

export const PUT: RequestHandler = async ({ locals, platform }) => {
  if (!locals.user) return json({ error: "Unauthorized." }, { status: 401 });
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });

  return json(await generateApiKey(platform.env.API_KEY), {
    headers: NO_STORE_HEADERS,
  });
};
