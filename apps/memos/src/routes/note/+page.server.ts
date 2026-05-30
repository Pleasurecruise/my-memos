import { error, redirect } from "@sveltejs/kit";
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
  const fileMeta: Record<string, { size: number; updated: string }> = {};

  let cursor: string | undefined;

  do {
    const result = await bucket.list({ prefix: "blog/", cursor });

    for (const object of result.objects) {
      if (object.key.endsWith("/")) continue;
      paths.push(object.key);
      fileMeta[object.key] = {
        size: object.size,
        updated: object.uploaded.toISOString(),
      };
    }

    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);

  return { paths, fileMeta };
};
