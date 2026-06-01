import { error, redirect } from "@sveltejs/kit";
import type { R2ListOptions } from "@cloudflare/workers-types";
import { BLOG_PREFIX, slugFromR2Key, slugToTitle } from "$lib/server/blog";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform, locals, url }) => {
  if (!locals.user) {
    redirect(302, `/login?redirect=${url.pathname}`);
  }
  if (!platform) {
    error(500, "Cloudflare platform bindings are unavailable.");
  }

  const bucket = platform.env.MEMOS_BUCKET;
  const paths: string[] = [];
  const fileMeta: Record<
    string,
    { size: number; createdAt: string; updatedAt: string; title: string }
  > = {};

  let cursor: string | undefined;

  do {
    const listOpts: R2ListOptions & { include: string[] } = {
      prefix: BLOG_PREFIX,
      limit: 1000,
      cursor,
      include: ["customMetadata"],
    };
    const listingResponse = await bucket.list(listOpts);

    for (const r2Object of listingResponse.objects) {
      if (r2Object.key.endsWith("/") || !r2Object.key.toLowerCase().endsWith(".md")) continue;
      const path = slugFromR2Key(r2Object.key);
      const fallbackDate = r2Object.uploaded.toISOString();
      paths.push(path);
      fileMeta[path] = {
        size: r2Object.size,
        createdAt: r2Object.customMetadata?.createdAt ?? fallbackDate,
        updatedAt: r2Object.customMetadata?.updatedAt ?? fallbackDate,
        title: r2Object.customMetadata?.title ?? slugToTitle(path),
      };
    }

    cursor = listingResponse.truncated ? listingResponse.cursor : undefined;
  } while (cursor);

  return { paths, fileMeta };
};
