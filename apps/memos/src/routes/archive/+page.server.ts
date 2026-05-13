import { redirect } from "@sveltejs/kit";
import { listMemos, listTagCounts } from "$lib/server/memos";
import { parsePageFilters } from "$lib/server/filters";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform, url, locals }) => {
  if (!locals.user) {
    redirect(302, `/login?redirect=${url.pathname}`);
  }
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
      archivedOnly: true,
      date: filters.date || undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
    }),
    listTagCounts(platform.env.DB, platform.env.MEMOS_CACHE),
  ]);

  return {
    memos,
    tags: tagCounts,
    filters,
  };
};
