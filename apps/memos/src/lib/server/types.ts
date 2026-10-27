import type { ApiKeyNamespace } from "#lib/server/apikey/service.ts";

export interface AppEnv {
  DB: D1Database;
  MEMOS_BUCKET: R2Bucket;
  MEMOS_CACHE: KVNamespace;
  API_KEY: ApiKeyNamespace;
}
