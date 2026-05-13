import { getAuth } from "$lib/server/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";

export async function handle({ event, resolve }) {
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
}
