export interface AppEnv {
  DB: D1Database;
  MEMOS_BUCKET: R2Bucket;
  MEMOS_CACHE: KVNamespace;
}
