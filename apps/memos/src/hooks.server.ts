import { getAuth } from "$lib/server/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import type { Handle } from "@sveltejs/kit";

const scannerNoisePaths = new Set(["/robots.txt", "/sitemap.xml"]);

export const handle: Handle = async ({ event, resolve }) => {
  if (scannerNoisePaths.has(event.url.pathname)) {
    return new Response(null, { status: 204 });
  }

  if (event.url.pathname === "/favicon.ico") {
    return Response.redirect(new URL("/favicon.png", event.url), 301);
  }

  if (!event.platform) return resolve(event);

  const auth = getAuth(event.platform.env);

  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  return svelteKitHandler({ event, resolve, auth, building });
};
