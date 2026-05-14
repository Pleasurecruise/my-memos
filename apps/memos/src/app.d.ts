import type { D1Database, KVNamespace, R2Bucket } from "@cloudflare/workers-types";
import type { User, Session } from "better-auth";

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
    }
    interface Platform {
      env: {
        DB: D1Database;
        MEMOS_BUCKET: R2Bucket;
        MEMOS_CACHE: KVNamespace;
        BETTER_AUTH_SECRET: string;
        BETTER_AUTH_URL: string;
        GOOGLE_CLIENT_ID: string;
        GOOGLE_CLIENT_SECRET: string;
        ALLOWED_EMAIL: string;
        CF_ACCOUNT_ID: string;
        CF_GATEWAY_NAME: string;
        AI_GATEWAY_PROVIDER_SLUG: string;
        OPENAI_API_KEY: string;
        CF_AIG_TOKEN: string;
        TAVILY_API_KEY: string;
      };
    }
  }
}

export {};
