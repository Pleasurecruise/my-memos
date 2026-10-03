import { env } from "cloudflare:workers";
import type { Handle } from "@sveltejs/kit/hooks";
import { getAuth } from "#lib/server/auth.ts";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/env";

let cachedAuth: ReturnType<typeof getAuth> | null = null;

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname === "/favicon.ico") {
    return Response.redirect(new URL("/favicon.png", event.url), 301);
  }

  if (!cachedAuth) {
    cachedAuth = getAuth(env);
  }
  const auth = cachedAuth;

  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  event.locals.session = null;
  event.locals.user = null;
  if (session && session.user.email === env.ALLOWED_EMAIL) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  return svelteKitHandler({ event, resolve, auth, building });
};
