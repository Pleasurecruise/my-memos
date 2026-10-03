import { env } from "cloudflare:workers";
import { verifyApiKey } from "#lib/server/apikey/index.ts";
import { deleteMemo, getMemo, MemoError, updateMemo } from "#lib/server/memos/index.ts";
import { z } from "zod";
import type { RequestHandler } from "./$types";
import type { UpdateMemoInput } from "#lib/server/memos/types.ts";

const updateMemoSchema = z.object({
  content: z.string().trim().min(1).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
  favorite: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export const GET: RequestHandler = async ({ params, request }) => {
  if (!(await verifyApiKey(request, env.API_KEY))) {
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  const memo = await getMemo(env.DB, env.MEMOS_BUCKET, params.id);
  if (!memo) return Response.json({ error: "Memo not found." }, { status: 404 });
  return Response.json({ memo });
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  if (!(await verifyApiKey(request, env.API_KEY))) {
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  const result = updateMemoSchema.safeParse(await request.json());
  if (!result.success) return Response.json({ error: "Invalid memo payload." }, { status: 400 });
  if (Object.keys(result.data).length === 0) {
    return Response.json({ error: "No memo changes provided." }, { status: 400 });
  }
  const input: UpdateMemoInput = result.data;

  try {
    const memo = await updateMemo(env.DB, env.MEMOS_BUCKET, env.MEMOS_CACHE, params.id, input);
    return Response.json({ memo });
  } catch (error) {
    if (!(error instanceof MemoError)) throw error;
    return Response.json({ error: error.message }, { status: 404 });
  }
};

export const DELETE: RequestHandler = async ({ params, request }) => {
  if (!(await verifyApiKey(request, env.API_KEY))) {
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  try {
    await deleteMemo(env.DB, env.MEMOS_BUCKET, env.MEMOS_CACHE, params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (!(error instanceof MemoError)) throw error;
    return Response.json({ error: error.message }, { status: 404 });
  }
};
