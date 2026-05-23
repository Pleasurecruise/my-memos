import { updateMemo, deleteMemo } from "$lib/server/memos";
import { json } from "@sveltejs/kit";
import { z } from "zod";
import type { RequestHandler } from "./$types";
import type { UpdateMemoInput } from "$lib/server/memos/types";

const updateMemoSchema = z.object({
  content: z.string().trim().min(1).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export const PATCH: RequestHandler = async ({ request, params, platform, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!platform) {
    return json({ error: "Cloudflare platform bindings are unavailable." }, { status: 500 });
  }

  const { id } = params;

  const result = updateMemoSchema.safeParse(await request.json());

  if (!result.success) {
    const fields = new Set(result.error.issues.map((issue) => issue.path[0]));

    if (fields.has("content")) {
      return json({ error: "Memo content cannot be empty." }, { status: 400 });
    }

    if (fields.has("visibility")) {
      return json({ error: "Memo visibility is invalid." }, { status: 400 });
    }

    if (fields.has("tags")) {
      return json({ error: "Memo tags are invalid." }, { status: 400 });
    }

    return json({ error: "Memo update payload is invalid." }, { status: 400 });
  }

  const input: UpdateMemoInput = result.data;

  try {
    const memo = await updateMemo(
      platform.env.DB,
      platform.env.MEMOS_BUCKET,
      platform.env.MEMOS_CACHE,
      id,
      input,
    );
    return json({ memo });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update memo.";
    return json({ error: message }, { status: message.includes("not found") ? 404 : 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, platform, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!platform) {
    return json({ error: "Cloudflare platform bindings are unavailable." }, { status: 500 });
  }

  const { id } = params;

  try {
    await deleteMemo(platform.env.DB, platform.env.MEMOS_BUCKET, platform.env.MEMOS_CACHE, id);
    return new Response(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete memo.";
    return json({ error: message }, { status: message.includes("not found") ? 404 : 500 });
  }
};
