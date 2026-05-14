import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    redirect(302, `/login?redirect=${url.pathname}`);
  }
  return { user: locals.user };
};
