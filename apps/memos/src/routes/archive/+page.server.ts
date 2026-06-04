import { error, redirect } from "@sveltejs/kit";
import { listMemos, listTagCounts } from "$lib/server/memos";
import { parsePageFilters } from "$lib/server/filters";
import type { PageServerLoad } from "./$types";

const PAGE_LIMIT = 25;

export const load: PageServerLoad = async ({ platform, url, locals }) => {
  if (!locals.user) {
    redirect(302, `/login?redirect=${url.pathname}`);
  }
  if (!platform) {
    error(500, "Cloudflare platform bindings are unavailable.");
  }

  const filters = parsePageFilters(url);

  const [{ memos, nextCursor }, tagCounts] = await Promise.all([
    listMemos(platform.env.DB, platform.env.MEMOS_CACHE, {
      archivedOnly: true,
      date: filters.date || undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
      limit: PAGE_LIMIT,
    }),
    listTagCounts(platform.env.DB, platform.env.MEMOS_CACHE),
  ]);

  return {
    memos,
    nextCursor,
    tags: tagCounts,
    filters,
  };
};
