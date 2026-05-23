import { createMemo } from "$lib/server/memos";
import { json } from "@sveltejs/kit";
import { z } from "zod";
import type { RequestHandler } from "./$types";

const createMemoSchema = z.object({
  content: z.string().trim().min(1),
  visibility: z.enum(["public", "private"]),
  tags: z.array(z.string()).default([]),
});

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!platform) {
    return json({ error: "Cloudflare platform bindings are unavailable." }, { status: 500 });
  }

  const result = createMemoSchema.safeParse(await request.json());

  if (!result.success) {
    const fields = new Set(result.error.issues.map((issue) => issue.path[0]));

    if (fields.has("content")) {
      return json({ error: "Memo content is required." }, { status: 400 });
    }

    if (fields.has("visibility")) {
      return json({ error: "Memo visibility is invalid." }, { status: 400 });
    }

    return json({ error: "Memo tags are invalid." }, { status: 400 });
  }

  const { content, visibility, tags } = result.data;

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
