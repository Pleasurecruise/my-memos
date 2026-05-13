import { betterAuth } from "better-auth";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";

export function getAuth(env: NonNullable<App.Platform>["env"]) {
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.BETTER_AUTH_URL],
    advanced: {
      useSecureCookies: env.BETTER_AUTH_URL.startsWith("https"),
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (env.ALLOWED_EMAIL && user.email !== env.ALLOWED_EMAIL) {
              return false;
            }
          },
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    plugins: [sveltekitCookies(getRequestEvent)],
  });
}

export type Auth = ReturnType<typeof getAuth>;
