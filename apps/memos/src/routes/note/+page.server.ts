import { error, redirect } from "@sveltejs/kit";
import { listNotes } from "$lib/server/notes";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform, locals }) => {
  if (!locals.user) {
    redirect(302, "/");
  }
  if (!platform) {
    error(500, "Cloudflare platform bindings are unavailable.");
  }

  return listNotes({
    bucket: platform.env.MEMOS_BUCKET,
    cache: platform.env.MEMOS_CACHE,
  });
};
