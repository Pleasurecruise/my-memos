import type { D1Database, KVNamespace, R2Bucket } from "@cloudflare/workers-types";

declare global {
  namespace App {
    interface Platform {
      env: {
        DB: D1Database;
        MEMOS_BUCKET: R2Bucket;
        MEMOS_CACHE: KVNamespace;
      };
    }
  }
}

export {};
