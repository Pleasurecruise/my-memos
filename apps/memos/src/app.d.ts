import type {
  Ai,
  D1Database,
  DurableObjectNamespace,
  KVNamespace,
  R2Bucket,
} from "@cloudflare/workers-types";
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
        AI: Ai;
        ChatAgent: DurableObjectNamespace;
        BETTER_AUTH_SECRET: string;
        BETTER_AUTH_URL: string;
        GOOGLE_CLIENT_ID: string;
        GOOGLE_CLIENT_SECRET: string;
        ALLOWED_EMAIL: string;
      };
    }
  }
}

export {};
