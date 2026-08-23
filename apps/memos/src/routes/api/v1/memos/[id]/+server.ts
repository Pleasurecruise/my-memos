import { verifyApiKey } from "$lib/server/apikey";
import { deleteMemo, getMemo, MemoError, updateMemo } from "$lib/server/memos";
import { json } from "@sveltejs/kit";
import { z } from "zod";
import type { RequestHandler } from "./$types";
import type { UpdateMemoInput } from "$lib/server/memos/types";

const updateMemoSchema = z.object({
  content: z.string().trim().min(1).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
  favorite: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export const GET: RequestHandler = async ({ params, request, platform }) => {
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });
  if (!(await verifyApiKey(request, platform.env.API_KEY))) {
    return json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  const memo = await getMemo(platform.env.DB, platform.env.MEMOS_BUCKET, params.id);
  if (!memo) return json({ error: "Memo not found." }, { status: 404 });
  return json({ memo });
};

export const PATCH: RequestHandler = async ({ params, request, platform }) => {
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });
  if (!(await verifyApiKey(request, platform.env.API_KEY))) {
    return json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  const result = updateMemoSchema.safeParse(await request.json());
  if (!result.success) return json({ error: "Invalid memo payload." }, { status: 400 });
  if (Object.keys(result.data).length === 0) {
    return json({ error: "No memo changes provided." }, { status: 400 });
  }
  const input: UpdateMemoInput = result.data;

  try {
    const memo = await updateMemo(
      platform.env.DB,
      platform.env.MEMOS_BUCKET,
      platform.env.MEMOS_CACHE,
      params.id,
      input,
    );
    return json({ memo });
  } catch (error) {
    if (!(error instanceof MemoError)) throw error;
    return json({ error: error.message }, { status: 404 });
  }
};

export const DELETE: RequestHandler = async ({ params, request, platform }) => {
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });
  if (!(await verifyApiKey(request, platform.env.API_KEY))) {
    return json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  try {
    await deleteMemo(
      platform.env.DB,
      platform.env.MEMOS_BUCKET,
      platform.env.MEMOS_CACHE,
      params.id,
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    if (!(error instanceof MemoError)) throw error;
    return json({ error: error.message }, { status: 404 });
  }
};
