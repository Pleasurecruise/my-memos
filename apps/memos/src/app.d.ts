import type { User, Session } from "better-auth";

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
    }
    interface Platform {
      ctx: ExecutionContext;
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
        CF_AIG_TOKEN: string;
        MCP_API_KEY: string;
        TAVILY_API_KEY: string;
      };
    }
  }
}

export {};
