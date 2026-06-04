import { sql, type SQL } from "drizzle-orm";
import { memos } from "$lib/server/db/schema";

type MemoDateColumn = typeof memos.createdAt | typeof memos.updatedAt;
type DateOperator = "<=" | ">=" | "=";

export function buildMemoDateCondition(field: MemoDateColumn, date: string, op: DateOperator): SQL {
  return sql`substr(${field}, 1, 10) ${sql.raw(op)} ${date}`;
}

export function buildMemoTagCondition(tag: string): SQL {
  return sql`EXISTS (SELECT 1 FROM json_each(memos.tags_json) WHERE lower(json_each.value) = lower(${tag}))`;
}

export function buildMemoTagConditions(tags: string[]): SQL[] {
  return tags.map((tag) => buildMemoTagCondition(tag));
}
