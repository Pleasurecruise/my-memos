import { createMemo, isValidMemoCursor, listMemos } from "$lib/server/memos";
import { json } from "@sveltejs/kit";
import { z } from "zod";
import type { RequestHandler } from "./$types";

const createMemoSchema = z.object({
  content: z.string().trim().min(1),
  visibility: z.enum(["public", "private"]),
  tags: z.array(z.string()).default([]),
});

const listQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  date: z.string().optional(),
  tags: z.string().optional(),
  publicOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  archivedOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  sortByUpdated: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export const GET: RequestHandler = async ({ url, platform, locals }) => {
  if (!platform) {
    return json({ error: "Cloudflare platform bindings are unavailable." }, { status: 500 });
  }

  const rawParams = Object.fromEntries(url.searchParams.entries());
  const queryParams = listQuerySchema.safeParse(rawParams);
  if (!queryParams.success) {
    return json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const { cursor, limit, search, date, tags, publicOnly, archivedOnly, sortByUpdated } =
    queryParams.data;
  if (archivedOnly && !locals.user) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }
  if (cursor && !isValidMemoCursor(cursor)) {
    return json({ error: "Invalid cursor." }, { status: 400 });
  }

  const effectivePublic = publicOnly || !locals.user;
  const tagList = tags
    ?.split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const memoPage = await listMemos(platform.env.DB, platform.env.MEMOS_CACHE, {
    cursor,
    limit,
    search,
    date,
    tags: tagList,
    publicOnly: effectivePublic,
    archivedOnly,
    sortByUpdated,
  });

  return json(memoPage);
};

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
