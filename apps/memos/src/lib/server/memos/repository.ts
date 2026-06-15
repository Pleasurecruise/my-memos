import type { D1Database, KVNamespace, R2Bucket } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq, gte, like, or, sql } from "drizzle-orm";
import { memos } from "../db/schema";
import type { MemoRow } from "../db/schema";
import { buildMemoDateCondition, buildMemoTagConditions } from "./query";
import { buildMemoR2Key, createMemoId, normalizeTags } from "./utils";
import { stripHashtags } from "$lib/utils";
import type { CreateMemoInput, UpdateMemoInput, MemoListFilters, MemoPage } from "./types";
import type { Memo, MemoStats, TagCount } from "$lib/types";

const DEFAULT_LIMIT = 25;
const CURSOR_VALUE_SEPARATOR = "|";
const MEMO_ID_RE = /^\d{8}T\d{6}Z-[0-9a-f]{8}$/;
const SORT_VALUE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function rowToMemo(row: MemoRow): Memo {
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

async function invalidateMemoCache(cache: KVNamespace): Promise<void> {
  await Promise.all([cache.delete("memo:tags"), cache.delete("memo:tags:public")]);
}

function encodeCursor(pinned: boolean, sortValue: string, id: string): string {
  const pinnedValue = pinned ? "1" : "0";
  const cursorValue = [pinnedValue, sortValue, id].join(CURSOR_VALUE_SEPARATOR);
  return btoa(cursorValue);
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

export async function getMemo(d1: D1Database, bucket: R2Bucket, id: string): Promise<Memo | null> {
  const db = drizzle(d1);
  const [row] = await db.select().from(memos).where(eq(memos.id, id)).limit(1);
  if (!row) return null;

  const memo = rowToMemo(row);

  const obj = await bucket.get(row.r2Key);
  if (obj) {
    memo.content = await obj.text();
  }

  return memo;
}

export async function listMemos(
  d1: D1Database,
  cache: KVNamespace,
  filters: MemoListFilters = {},
): Promise<MemoPage> {
  const sortColumn = filters.sortByUpdated ? memos.updatedAt : memos.createdAt;
  const limit = filters.limit ?? DEFAULT_LIMIT;

  const db = drizzle(d1);
  const conditions = [filters.archivedOnly ? eq(memos.archived, true) : eq(memos.archived, false)];

  if (filters.publicOnly) conditions.push(eq(memos.visibility, "public"));

  if (filters.date) {
    conditions.push(buildMemoDateCondition(memos.updatedAt, filters.date, "="));
  }

  if (filters.search) {
    conditions.push(like(memos.excerpt, `%${filters.search}%`));
  }

  if (filters.tags?.length) {
    const tagClauses = buildMemoTagConditions(filters.tags);
    const tagCondition = or(...tagClauses);
    if (tagCondition) conditions.push(tagCondition);
  }

  if (filters.cursor) {
    const decoded = decodeCursor(filters.cursor);
    if (!decoded) throw new Error("Invalid memo cursor.");
    conditions.push(
      sql`(${memos.pinned}, ${sortColumn}, ${memos.id}) < (${decoded.p ? 1 : 0}, ${decoded.v}, ${decoded.i})`,
    );
  }

  // Fetch one extra to determine if there are more
  const rows = await db
    .select()
    .from(memos)
    .where(and(...conditions))
    .orderBy(desc(memos.pinned), desc(sortColumn), desc(memos.id))
    .limit(limit + 1);

  const hasMore: boolean = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const pageMemos: Memo[] = pageRows.map(rowToMemo);

  const nextCursor: string | null =
    hasMore && pageMemos.length > 0
      ? encodeCursor(
          pageMemos[pageMemos.length - 1].pinned,
          sortColumn === memos.updatedAt
            ? pageMemos[pageMemos.length - 1].updatedAt
            : pageMemos[pageMemos.length - 1].createdAt,
          pageMemos[pageMemos.length - 1].id,
        )
      : null;

  return { memos: pageMemos, nextCursor };
}

export async function listMemoActivity(
  d1: D1Database,
  publicOnly: boolean,
  since: string,
): Promise<Memo[]> {
  const db = drizzle(d1);
  const conditions = [eq(memos.archived, false), gte(memos.createdAt, since)];

  if (publicOnly) conditions.push(eq(memos.visibility, "public"));

  const rows = await db
    .select()
    .from(memos)
    .where(and(...conditions))
    .orderBy(desc(memos.createdAt), desc(memos.id));

  return rows.map(rowToMemo);
}

export async function listTagCounts(
  d1: D1Database,
  cache: KVNamespace,
  publicOnly = false,
): Promise<TagCount[]> {
  const cacheKey = publicOnly ? "memo:tags:public" : "memo:tags";
  const cached = await cache.get(cacheKey, "json");
  if (cached) return cached as TagCount[];

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

  const tags = (results ?? []).map((row) => ({ name: row.name, count: Number(row.count) }));
  await cache.put(cacheKey, JSON.stringify(tags));
  return tags;
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

  return {
    total: row?.total ?? 0,
    today: row?.today ?? 0,
  };
}

export async function createMemo(
  d1: D1Database,
  bucket: R2Bucket,
  cache: KVNamespace,
  input: CreateMemoInput,
): Promise<Memo> {
  const now = new Date();
  const id = createMemoId(now);
  const tags = input.tags.length ? input.tags : normalizeTags(input.content);
  const r2Key = buildMemoR2Key(id, now);
  const content = input.content.trim();
  const nowIso = now.toISOString();

  await bucket.put(r2Key, content, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
  });

  const db = drizzle(d1);
  await db.insert(memos).values({
    id,
    r2Key,
    tagsJson: tags,
    excerpt: content,
    createdAt: nowIso,
    updatedAt: nowIso,
    visibility: input.visibility,
    pinned: false,
    archived: false,
  });

  await invalidateMemoCache(cache);

  return {
    id,
    content,
    tags,
    createdAt: nowIso,
    updatedAt: nowIso,
    visibility: input.visibility,
    pinned: false,
    archived: false,
  };
}

export async function updateMemo(
  d1: D1Database,
  bucket: R2Bucket,
  cache: KVNamespace,
  id: string,
  input: UpdateMemoInput,
): Promise<Memo> {
  const db = drizzle(d1);

  const [existing] = await db.select().from(memos).where(eq(memos.id, id)).limit(1);
  if (!existing) throw new Error(`Memo not found: ${id}`);

  const setValues: Partial<typeof memos.$inferInsert> = {};

  if (input.content !== undefined) {
    const content = input.content.trim();
    await bucket.put(existing.r2Key, content, {
      httpMetadata: { contentType: "text/markdown; charset=utf-8" },
    });
    setValues.excerpt = content;
    setValues.tagsJson = input.tags?.length ? input.tags : normalizeTags(content);
  } else if (input.tags !== undefined) {
    const newTags = input.tags.length ? input.tags : [];
    setValues.tagsJson = newTags;

    // Sync R2 body: strip old hashtags from the body, then append new ones at the end
    const bodyObj = await bucket.get(existing.r2Key);
    if (bodyObj) {
      let body = (await bodyObj.text()).trimEnd();
      body = stripHashtags(body).trimEnd();
      if (newTags.length > 0) {
        const tagLine = newTags.map((t) => `#${t}`).join(" ");
        body = body + "\n\n" + tagLine;
      }
      await bucket.put(existing.r2Key, body, {
        httpMetadata: { contentType: "text/markdown; charset=utf-8" },
      });
      setValues.excerpt = body;
    }
  }

  if (input.visibility !== undefined) setValues.visibility = input.visibility;
  if (input.pinned !== undefined) setValues.pinned = input.pinned;
  if (input.archived !== undefined) setValues.archived = input.archived;

  setValues.updatedAt = new Date().toISOString();

  await db.update(memos).set(setValues).where(eq(memos.id, id));
  await invalidateMemoCache(cache);

  const [updated] = await db.select().from(memos).where(eq(memos.id, id)).limit(1);
  return rowToMemo(updated!);
}

export async function deleteMemo(
  d1: D1Database,
  bucket: R2Bucket,
  cache: KVNamespace,
  id: string,
): Promise<void> {
  const db = drizzle(d1);

  const [existing] = await db
    .select({ r2Key: memos.r2Key })
    .from(memos)
    .where(eq(memos.id, id))
    .limit(1);
  if (!existing) throw new Error(`Memo not found: ${id}`);

  await db.delete(memos).where(eq(memos.id, id));
  await bucket.delete(existing.r2Key);
  await invalidateMemoCache(cache);
}
