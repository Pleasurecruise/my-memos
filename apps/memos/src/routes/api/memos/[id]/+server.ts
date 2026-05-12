import { updateMemo, deleteMemo } from "$lib/server/memos";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { MemoVisibility, UpdateMemoInput } from "$lib/server/memos/types";

const VISIBILITIES = new Set<MemoVisibility>(["public", "private"]);

export const PATCH: RequestHandler = async ({ request, params, platform }) => {
  if (!platform) {
    return json({ error: "Cloudflare platform bindings are unavailable." }, { status: 500 });
  }

  const { id } = params;

  const body = (await request.json()) as {
    content?: unknown;
    visibility?: unknown;
    pinned?: unknown;
    archived?: unknown;
  };

  const input: UpdateMemoInput = {};

  if (body.content !== undefined) {
    const content = typeof body.content === "string" ? body.content.trim() : null;
    if (!content) return json({ error: "Memo content cannot be empty." }, { status: 400 });
    input.content = content;
  }

  if (body.visibility !== undefined) {
    if (
      typeof body.visibility !== "string" ||
      !VISIBILITIES.has(body.visibility as MemoVisibility)
    ) {
      return json({ error: "Memo visibility is invalid." }, { status: 400 });
    }
    input.visibility = body.visibility as MemoVisibility;
  }

  if (body.pinned !== undefined) input.pinned = Boolean(body.pinned);
  if (body.archived !== undefined) input.archived = Boolean(body.archived);

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

export const DELETE: RequestHandler = async ({ params, platform }) => {
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
