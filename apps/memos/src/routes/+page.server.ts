import { listMemos, listTagCounts } from "$lib/server/memos";
import { parsePageFilters } from "$lib/server/filters";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform, url, locals }) => {
  if (!platform) {
    return {
      memos: [],
      tags: [],
      filters: { search: "", date: "", tags: [] as string[] },
    };
  }

  const filters = parsePageFilters(url);

  const [memos, tagCounts] = await Promise.all([
    listMemos(platform.env.DB, platform.env.MEMOS_CACHE, {
      search: filters.search || undefined,
      date: filters.date || undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
    }),
    listTagCounts(platform.env.DB, platform.env.MEMOS_CACHE),
  ]);

  const visibleMemos = locals.user ? memos : memos.filter((m) => m.visibility !== "private");

  return {
    memos: visibleMemos,
    tags: tagCounts,
    filters,
  };
};
