import { env } from "cloudflare:workers";
import { generateApiKey, getApiKeyStatus } from "#lib/server/apikey/index.ts";
import type { RequestHandler } from "./$types";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) return Response.json({ error: "Unauthorized." }, { status: 401 });

  return Response.json(await getApiKeyStatus(env.API_KEY), {
    headers: NO_STORE_HEADERS,
  });
};

export const POST: RequestHandler = async ({ locals }) => {
  if (!locals.user) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const status = await getApiKeyStatus(env.API_KEY);
  if (status.configured) {
    return Response.json(
      { error: "API key already exists." },
      { status: 409, headers: NO_STORE_HEADERS },
    );
  }

  return Response.json(await generateApiKey(env.API_KEY), { headers: NO_STORE_HEADERS });
};

export const PUT: RequestHandler = async ({ locals }) => {
  if (!locals.user) return Response.json({ error: "Unauthorized." }, { status: 401 });

  return Response.json(await generateApiKey(env.API_KEY), {
    headers: NO_STORE_HEADERS,
  });
};
