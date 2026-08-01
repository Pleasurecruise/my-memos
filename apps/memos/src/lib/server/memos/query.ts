import { and, gte, lt, sql, type SQL } from "drizzle-orm";
import { memos } from "$lib/server/db/schema";

type MemoDateColumn = typeof memos.createdAt | typeof memos.updatedAt;
type DateOperator = "<=" | ">=" | "=";

export function buildMemoDateCondition(field: MemoDateColumn, date: string, op: DateOperator): SQL {
  const start = `${date}T00:00:00.000Z`;
  const nextDay = new Date(Date.parse(start) + 86_400_000).toISOString();

  if (op === ">=") return gte(field, start);
  if (op === "<=") return lt(field, nextDay);
  return and(gte(field, start), lt(field, nextDay))!;
}

export function buildMemoTagCondition(tag: string): SQL {
  return sql`EXISTS (SELECT 1 FROM json_each(memos.tags_json) WHERE lower(json_each.value) = lower(${tag}))`;
}

export function buildMemoTagConditions(tags: string[]): SQL[] {
  return tags.map((tag) => buildMemoTagCondition(tag));
}
