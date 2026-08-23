import { verifyApiKey } from "$lib/server/apikey";
import {
  createMemo,
  isValidMemoCursor,
  listMemos,
  memoDateSchema,
  memoSearchSchema,
} from "$lib/server/memos";
import { json } from "@sveltejs/kit";
import { z } from "zod";
import type { RequestHandler } from "./$types";

const listQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: memoSearchSchema.optional(),
  date: memoDateSchema.optional(),
  tags: z.string().optional(),
  publicOnly: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  archivedOnly: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  favoritesOnly: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  sortByUpdated: z
    .string()
    .optional()
    .transform((value) => value === "true"),
});

const createMemoSchema = z.object({
  content: z.string().trim().min(1),
  visibility: z.enum(["public", "private"]).default("private"),
  tags: z.array(z.string()).default([]),
  favorite: z.boolean().default(false),
});

export const GET: RequestHandler = async ({ request, url, platform }) => {
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });
  if (!(await verifyApiKey(request, platform.env.API_KEY))) {
    return json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  const query = listQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!query.success) return json({ error: "Invalid query parameters." }, { status: 400 });
  if (query.data.cursor && !isValidMemoCursor(query.data.cursor)) {
    return json({ error: "Invalid cursor." }, { status: 400 });
  }

  let tags: string[] = [];
  if (query.data.tags) {
    tags = query.data.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return json(
    await listMemos(platform.env.DB, {
      cursor: query.data.cursor,
      limit: query.data.limit,
      search: query.data.search,
      date: query.data.date,
      tags,
      publicOnly: query.data.publicOnly,
      archivedOnly: query.data.archivedOnly,
      favoritesOnly: query.data.favoritesOnly,
      sortByUpdated: query.data.sortByUpdated,
    }),
  );
};

export const POST: RequestHandler = async ({ request, platform }) => {
  if (!platform) return json({ error: "Platform bindings unavailable." }, { status: 500 });
  if (!(await verifyApiKey(request, platform.env.API_KEY))) {
    return json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  const input = createMemoSchema.safeParse(await request.json());
  if (!input.success) return json({ error: "Invalid memo payload." }, { status: 400 });
  const memo = await createMemo(platform.env.DB, platform.env.MEMOS_BUCKET, input.data);
  return json({ memo }, { status: 201 });
};
