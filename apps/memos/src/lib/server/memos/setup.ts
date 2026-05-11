import type { D1Database } from "@cloudflare/workers-types";
import schemaSql from "./schema.sql?raw";

let schemaReady = false;

export async function ensureMemoSchema(db: D1Database): Promise<void> {
  if (schemaReady) return;

  if (!db) {
    throw new Error("D1 binding `DB` is not available on platform.env.");
  }

  await db.exec(schemaSql);

  schemaReady = true;
}
