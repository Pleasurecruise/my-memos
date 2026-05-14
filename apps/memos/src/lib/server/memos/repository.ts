import type { D1Database, KVNamespace, R2Bucket } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { memos } from "../db/schema";
import type { MemoRow } from "../db/schema";
import { buildMemoR2Key, createMemoId, normalizeTags } from "./utils";
import type { CreateMemoInput, UpdateMemoInput, MemoListFilters } from "./types";
import type { Memo, TagCount } from "$lib/types";

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
  await Promise.all([
    cache.delete("memo:list"),
    cache.delete("memo:list:public"),
    cache.delete("memo:tags"),
    cache.delete("memo:tags:public"),
  ]);
}

export async function readMemoContent(bucket: R2Bucket, r2Key: string): Promise<string> {
  const object = await bucket.get(r2Key);
  if (!object) throw new Error(`Missing R2 object: ${r2Key}`);
  return object.text();
}

export async function listMemos(
  d1: D1Database,
  cache: KVNamespace,
  filters: MemoListFilters = {},
): Promise<Memo[]> {
  const shouldCache =
    !filters.search && !filters.date && !filters.tags?.length && !filters.archivedOnly;
  const cacheKey = filters.publicOnly ? "memo:list:public" : "memo:list";

  if (shouldCache) {
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached) as Memo[];
  }

  const db = drizzle(d1);
  const conditions = [filters.archivedOnly ? eq(memos.archived, true) : eq(memos.archived, false)];

  if (filters.publicOnly) conditions.push(eq(memos.visibility, "public"));

  if (filters.date) {
    conditions.push(sql`substr(${memos.updatedAt}, 1, 10) = ${filters.date}`);
  }

  if (filters.search) {
    conditions.push(like(memos.excerpt, `%${filters.search}%`));
  }

  if (filters.tags?.length) {
    const tagClauses = filters.tags.map(
      (tag) =>
        sql`EXISTS (SELECT 1 FROM json_each(memos.tags_json) WHERE lower(json_each.value) = ${tag.toLowerCase()})`,
    );
    const tagCondition = or(...tagClauses);
    if (tagCondition) conditions.push(tagCondition);
  }

  const rows = await db
    .select()
    .from(memos)
    .where(and(...conditions))
    .orderBy(desc(memos.pinned), desc(memos.createdAt));

  const result = rows.map(rowToMemo);

  if (shouldCache) {
    await cache.put(cacheKey, JSON.stringify(result));
  }

  return result;
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
    setValues.tagsJson = input.tags.length ? input.tags : existing.tagsJson;
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
