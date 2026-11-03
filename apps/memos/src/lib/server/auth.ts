import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import env from "#env";

export function getAuth(db: D1Database) {
  return betterAuth({
    database: db,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.BETTER_AUTH_URL],
    advanced: {
      useSecureCookies: env.BETTER_AUTH_URL.startsWith("https"),
    },
    account: {
      accountLinking: { enabled: false },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    plugins: [
      genericOAuth({
        config: [
          {
            providerId: "you-find-me",
            name: "you-find.me",
            discoveryUrl: "https://you-find.me/api/auth/.well-known/openid-configuration",
            clientId: "memos",
            scopes: ["openid", "profile", "email"],
            tokenEndpointAuth: { method: "none" },
            pkce: true,
            disableSignUp: true,
          },
        ],
      }),
      sveltekitCookies(getRequestEvent),
    ],
  });
}

export type Auth = ReturnType<typeof getAuth>;
