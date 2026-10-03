import { env } from "cloudflare:workers";
import {
  createMemo,
  isValidMemoCursor,
  listMemos,
  memoDateSchema,
  memoSearchSchema,
} from "#lib/server/memos/index.ts";
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
  search: memoSearchSchema.optional(),
  date: memoDateSchema.optional(),
  tags: z.string().optional(),
  publicOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  archivedOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  favoritesOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  sortByUpdated: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export const GET: RequestHandler = async ({ url, locals }) => {
  const rawParams = Object.fromEntries(url.searchParams.entries());
  const queryParams = listQuerySchema.safeParse(rawParams);
  if (!queryParams.success) {
    return Response.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const {
    cursor,
    limit,
    search,
    date,
    tags,
    publicOnly,
    archivedOnly,
    favoritesOnly,
    sortByUpdated,
  } = queryParams.data;
  if ((archivedOnly || favoritesOnly) && !locals.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (cursor && !isValidMemoCursor(cursor)) {
    return Response.json({ error: "Invalid cursor." }, { status: 400 });
  }

  const effectivePublic = publicOnly || !locals.user;
  const tagList = tags
    ?.split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const memoPage = await listMemos(env.DB, {
    cursor,
    limit,
    search,
    date,
    tags: tagList,
    publicOnly: effectivePublic,
    archivedOnly,
    favoritesOnly,
    sortByUpdated,
  });

  return Response.json(memoPage);
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = createMemoSchema.safeParse(await request.json());

  if (!result.success) {
    const fields = new Set(result.error.issues.map((issue) => issue.path[0]));

    if (fields.has("content")) {
      return Response.json({ error: "Memo content is required." }, { status: 400 });
    }

    if (fields.has("visibility")) {
      return Response.json({ error: "Memo visibility is invalid." }, { status: 400 });
    }

    return Response.json({ error: "Memo tags are invalid." }, { status: 400 });
  }

  const { content, visibility, tags } = result.data;

  const memo = await createMemo(env.DB, env.MEMOS_BUCKET, {
    content,
    visibility,
    tags,
    favorite: false,
  });

  return Response.json({ memo }, { status: 201 });
};
