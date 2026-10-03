import { env } from "cloudflare:workers";
import { error, redirect } from "@sveltejs/kit";
import {
  isMemoSearchWithinLimit,
  isValidMemoDate,
  listMemos,
  listTagCounts,
} from "#lib/server/memos/index.ts";
import { parsePageFilters } from "#lib/server/filters.ts";
import type { PageServerLoad } from "./$types";

const PAGE_LIMIT = 25;

export const load: PageServerLoad = async ({ url, locals }) => {
  if (!locals.user) redirect(302, "/");

  const filters = parsePageFilters(url);
  if (!isMemoSearchWithinLimit(filters.search)) error(400, "Search query is too long.");
  if (filters.date && !isValidMemoDate(filters.date)) error(400, "Invalid date filter.");

  const [{ memos, nextCursor }, tagCounts] = await Promise.all([
    listMemos(env.DB, {
      favoritesOnly: true,
      date: filters.date || undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
      limit: PAGE_LIMIT,
    }),
    listTagCounts(env.DB),
  ]);

  return { memos, nextCursor, tags: tagCounts, filters };
};
