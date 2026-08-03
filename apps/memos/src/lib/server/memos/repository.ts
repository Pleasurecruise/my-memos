import { and, desc, eq, gte, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { memos, type MemoRow } from "$lib/server/db/schema";
import { buildMemoDateCondition, buildMemoTagConditions } from "./query";
import type { AgentMemoFilters, MemoContentRecord, MemoListFilters, MemoPage } from "./types";
import type { Memo, MemoStats, TagCount } from "$lib/types";

const DEFAULT_LIMIT = 25;
const CURSOR_VALUE_SEPARATOR = "|";
const MEMO_ID_RE = /^\d{8}T\d{6}Z-[0-9a-f]{8}$/;
const SORT_VALUE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function memoFromRow(row: MemoRow): Memo {
  return {
    id: row.id,
    content: row.excerpt,
    tags: row.tagsJson,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    visibility: row.visibility,
    pinned: row.pinned,
    archived: row.archived,
  };
}

function encodeCursor(pinned: boolean, sortValue: string, id: string): string {
  return btoa([pinned ? "1" : "0", sortValue, id].join(CURSOR_VALUE_SEPARATOR));
}

function decodeCursor(raw: string): { p: boolean; v: string; i: string } | null {
  if (!/^[A-Za-z0-9+/]{1,}={0,2}$/.test(raw) || raw.length % 4 !== 0) return null;

  const [pinned, sortValue, id, extra] = atob(raw).split(CURSOR_VALUE_SEPARATOR);
  if (extra !== undefined) return null;
  if (pinned !== "0" && pinned !== "1") return null;
  if (!SORT_VALUE_RE.test(sortValue) || !MEMO_ID_RE.test(id)) return null;

  return { p: pinned === "1", v: sortValue, i: id };
}

export function isValidMemoCursor(raw: string): boolean {
  return decodeCursor(raw) !== null;
}

export async function findMemoRow(d1: D1Database, id: string): Promise<MemoRow | null> {
  const db = drizzle(d1);
  const [row] = await db.select().from(memos).where(eq(memos.id, id)).limit(1);
  return row ?? null;
}

export async function listMemos(d1: D1Database, filters: MemoListFilters = {}): Promise<MemoPage> {
  const sortColumn = filters.sortByUpdated ? memos.updatedAt : memos.createdAt;
  const limit = filters.limit ?? DEFAULT_LIMIT;
  const conditions = [filters.archivedOnly ? eq(memos.archived, true) : eq(memos.archived, false)];

  if (filters.publicOnly) conditions.push(eq(memos.visibility, "public"));
  if (filters.date) conditions.push(buildMemoDateCondition(memos.updatedAt, filters.date, "="));
  if (filters.search) conditions.push(like(memos.excerpt, `%${filters.search}%`));
  if (filters.tags?.length) {
    const tagCondition = or(...buildMemoTagConditions(filters.tags));
    if (tagCondition) conditions.push(tagCondition);
  }
  if (filters.cursor) {
    const decoded = decodeCursor(filters.cursor);
    if (!decoded) throw new Error("Invalid memo cursor.");
    conditions.push(
      sql`(${memos.pinned}, ${sortColumn}, ${memos.id}) < (${decoded.p ? 1 : 0}, ${decoded.v}, ${decoded.i})`,
    );
  }

  const rows = await drizzle(d1)
    .select()
    .from(memos)
    .where(and(...conditions))
    .orderBy(desc(memos.pinned), desc(sortColumn), desc(memos.id))
    .limit(limit + 1);
  const hasMore = rows.length > limit;
  const pageMemos = (hasMore ? rows.slice(0, limit) : rows).map(memoFromRow);
  const lastMemo = pageMemos.at(-1);
  const nextCursor =
    hasMore && lastMemo
      ? encodeCursor(
          lastMemo.pinned,
          filters.sortByUpdated ? lastMemo.updatedAt : lastMemo.createdAt,
          lastMemo.id,
        )
      : null;

  return { memos: pageMemos, nextCursor };
}

export async function listMemoActivity(
  d1: D1Database,
  publicOnly: boolean,
  since: string,
): Promise<Memo[]> {
  const conditions = [eq(memos.archived, false), gte(memos.createdAt, since)];
  if (publicOnly) conditions.push(eq(memos.visibility, "public"));

  const rows = await drizzle(d1)
    .select()
    .from(memos)
    .where(and(...conditions))
    .orderBy(desc(memos.createdAt), desc(memos.id));
  return rows.map(memoFromRow);
}

export async function queryTagCounts(d1: D1Database, publicOnly = false): Promise<TagCount[]> {
  const visibilityClause = publicOnly ? "AND visibility = 'public'" : "";
  const { results } = await d1
    .prepare(
      `SELECT lower(json_each.value) AS name, COUNT(*) AS count
       FROM memos, json_each(memos.tags_json)
       WHERE archived = 0 ${visibilityClause}
       GROUP BY lower(json_each.value)
       ORDER BY count DESC, name ASC`,
    )
    .all<{ name: string; count: number }>();

  return (results ?? []).map((row) => ({ name: row.name, count: Number(row.count) }));
}

export async function countMemoStats(
  d1: D1Database,
  today: string,
  publicOnly = false,
): Promise<MemoStats> {
  const visibilityClause = publicOnly ? "AND visibility = 'public'" : "";
  const row = await d1
    .prepare(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN substr(created_at, 1, 10) = ? THEN 1 ELSE 0 END) AS today
       FROM memos
       WHERE archived = 0 ${visibilityClause}`,
    )
    .bind(today)
    .first<{ total: number; today: number | null }>();

  return { total: row?.total ?? 0, today: row?.today ?? 0 };
}

export async function listAgentMemoRecords(
  d1: D1Database,
  filters: AgentMemoFilters,
): Promise<MemoContentRecord[]> {
  const conditions = [eq(memos.archived, false)];
  if (filters.query) conditions.push(like(memos.excerpt, `%${filters.query}%`));
  if (filters.fromDate) {
    conditions.push(buildMemoDateCondition(memos.createdAt, filters.fromDate, ">="));
  }
  if (filters.toDate) {
    conditions.push(buildMemoDateCondition(memos.createdAt, filters.toDate, "<="));
  }
  if (filters.tags?.length) conditions.push(...buildMemoTagConditions(filters.tags));

  return drizzle(d1)
    .select({
      id: memos.id,
      r2Key: memos.r2Key,
      excerpt: memos.excerpt,
      tags: memos.tagsJson,
      createdAt: memos.createdAt,
    })
    .from(memos)
    .where(and(...conditions))
    .orderBy(desc(memos.createdAt))
    .limit(filters.limit);
}

export async function insertMemoRow(d1: D1Database, row: typeof memos.$inferInsert): Promise<void> {
  await drizzle(d1).insert(memos).values(row);
}

export async function updateMemoRow(
  d1: D1Database,
  id: string,
  values: Partial<typeof memos.$inferInsert>,
): Promise<MemoRow> {
  const db = drizzle(d1);
  await db.update(memos).set(values).where(eq(memos.id, id));
  const [updated] = await db.select().from(memos).where(eq(memos.id, id)).limit(1);
  return updated;
}

export async function deleteMemoRow(d1: D1Database, id: string): Promise<void> {
  await drizzle(d1).delete(memos).where(eq(memos.id, id));
}
