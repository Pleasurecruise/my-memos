import { createMemo, ensureMemoSchema } from "$lib/server/memos";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { MemoVisibility } from "$lib/types/memos";

const VISIBILITIES = new Set<MemoVisibility>(["public", "protected", "private"]);

export const POST: RequestHandler = async ({ request, platform }) => {
  if (!platform) {
    return json({ error: "Cloudflare platform bindings are unavailable." }, { status: 500 });
  }

  const body = (await request.json()) as {
    content?: unknown;
    visibility?: unknown;
    tags?: unknown;
  };

  const content = typeof body.content === "string" ? body.content.trim() : "";
  const visibility =
    typeof body.visibility === "string" && VISIBILITIES.has(body.visibility as MemoVisibility)
      ? (body.visibility as MemoVisibility)
      : null;
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === "string")
    : [];

  if (!content) {
    return json({ error: "Memo content is required." }, { status: 400 });
  }

  if (!visibility) {
    return json({ error: "Memo visibility is invalid." }, { status: 400 });
  }

  await ensureMemoSchema(platform.env.DB);
  const memo = await createMemo(
    platform.env.DB,
    platform.env.MEMOS_BUCKET,
    platform.env.MEMOS_CACHE,
    {
      content,
      visibility,
      tags,
    },
  );

  return json({ memo }, { status: 201 });
};
