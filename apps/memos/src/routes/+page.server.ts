import { listMemos, listTagCounts } from "$lib/server/memos";
import { parsePageFilters } from "$lib/server/filters";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform, url, locals }) => {
  if (!platform) {
    error(500, "Cloudflare platform bindings are unavailable.");
  }

  const filters = parsePageFilters(url);
  const publicOnly = !locals.user || filters.viewAsPublic;
  const sortByUpdated = filters.sortByUpdated;

  const [memos, tagCounts] = await Promise.all([
    listMemos(platform.env.DB, platform.env.MEMOS_CACHE, {
      search: filters.search || undefined,
      date: filters.date || undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
      publicOnly,
      sortByUpdated,
    }),
    listTagCounts(platform.env.DB, platform.env.MEMOS_CACHE, publicOnly),
  ]);

  const hasActiveFilters = !!(
    filters.search ||
    filters.date ||
    filters.tags.length > 0 ||
    filters.sortByUpdated
  );
  const activityMemos = hasActiveFilters
    ? await listMemos(platform.env.DB, platform.env.MEMOS_CACHE, { publicOnly })
    : memos;

  return {
    memos,
    activityMemos,
    tags: tagCounts,
    filters,
  };
};
