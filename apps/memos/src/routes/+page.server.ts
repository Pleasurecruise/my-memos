import { countMemoStats, listMemoActivity, listMemos, listTagCounts } from "$lib/server/memos";
import { parsePageFilters } from "$lib/server/filters";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const PAGE_LIMIT = 25;
const ACTIVITY_WEEKS = 14;

function activitySince(): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (ACTIVITY_WEEKS - 1) * 7);
  return start.toISOString();
}

export const load: PageServerLoad = async ({ platform, url, locals }) => {
  if (!platform) {
    error(500, "Cloudflare platform bindings are unavailable.");
  }

  const filters = parsePageFilters(url);
  const publicOnly = !locals.user || filters.viewAsPublic;
  const sortByUpdated = filters.sortByUpdated;

  const today = new Date().toISOString().slice(0, 10);

  const [{ memos, nextCursor }, tagCounts, memoStats] = await Promise.all([
    listMemos(platform.env.DB, platform.env.MEMOS_CACHE, {
      search: filters.search || undefined,
      date: filters.date || undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
      publicOnly,
      sortByUpdated,
      limit: PAGE_LIMIT,
    }),
    listTagCounts(platform.env.DB, platform.env.MEMOS_CACHE, publicOnly),
    countMemoStats(platform.env.DB, today, publicOnly),
  ]);

  const activityMemos = await listMemoActivity(platform.env.DB, publicOnly, activitySince());

  return {
    memos,
    nextCursor,
    activityMemos,
    memoStats,
    tags: tagCounts,
    filters,
  };
};
