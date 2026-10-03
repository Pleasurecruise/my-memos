import type { ApiKeyNamespace } from "#lib/server/apikey/service.ts";

export interface AppEnv {
  DB: D1Database;
  MEMOS_BUCKET: R2Bucket;
  MEMOS_CACHE: KVNamespace;
  API_KEY: ApiKeyNamespace;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ALLOWED_EMAIL: string;
  CF_ACCOUNT_ID: string;
  CF_AIG_TOKEN: string;
  TAVILY_API_KEY: string;
}
