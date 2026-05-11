import { listMemos, listTagCounts } from "$lib/server/memos";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform, url }) => {
  if (!platform) {
    return {
      memos: [],
      tags: [],
      filters: {
        search: "",
        date: "",
        tag: "",
      },
    };
  }

  const search = url.searchParams.get("search")?.trim() ?? "";
  const date = url.searchParams.get("date")?.trim() ?? "";
  const tag = url.searchParams.get("tag")?.trim().toLowerCase() ?? "";

  const [memos, tags] = await Promise.all([
    listMemos(platform.env.DB, platform.env.MEMOS_CACHE, {
      search: search || undefined,
      date: date || undefined,
      tag: tag || undefined,
    }),
    listTagCounts(platform.env.DB, platform.env.MEMOS_CACHE),
  ]);

  return {
    memos,
    tags,
    filters: {
      search,
      date,
      tag,
    },
  };
};
