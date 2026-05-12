import type { D1Database, KVNamespace, R2Bucket } from "@cloudflare/workers-types";
import { buildMemoR2Key, createMemoId, normalizeTags } from "./utils";
import type { CreateMemoInput, UpdateMemoInput, MemoListFilters } from "./types";
import type { Memo, TagCount } from "$lib/types/memos";

interface MemoRow {
  id: string;
  r2_key: string;
  tags_json: string;
  excerpt: string;
  created_at: string;
  updated_at: string;
  visibility: Memo["visibility"];
  pinned: number;
  archived: number;
}

function rowToMemo(row: MemoRow): Memo {
  return {
    id: row.id,
    r2Key: row.r2_key,
    content: row.excerpt,
    tags: JSON.parse(row.tags_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    visibility: row.visibility,
    pinned: Boolean(row.pinned),
    archived: Boolean(row.archived),
  };
}

export async function readMemoContent(bucket: R2Bucket, r2Key: string): Promise<string> {
  const object = await bucket.get(r2Key);
  if (!object) throw new Error(`Missing R2 object: ${r2Key}`);
  return object.text();
}

function buildListQuery(filters: MemoListFilters) {
  const conditions: string[] = [];
  const bindings: unknown[] = [];

  if (filters.archivedOnly) conditions.push("archived = 1");
  else conditions.push("archived = 0");

  if (filters.date) {
    conditions.push("substr(updated_at, 1, 10) = ?");
    bindings.push(filters.date);
  }

  if (filters.search) {
    conditions.push("excerpt LIKE ?");
    bindings.push(`%${filters.search}%`);
  }

  if (filters.tags && filters.tags.length > 0) {
    const tagClauses = filters.tags.map(
      () => "EXISTS (SELECT 1 FROM json_each(memos.tags_json) WHERE lower(json_each.value) = ?)",
    );
    conditions.push(`(${tagClauses.join(" OR ")})`);
    for (const t of filters.tags) bindings.push(t.toLowerCase());
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return {
    sql: `
			SELECT id, r2_key, tags_json, excerpt, created_at, updated_at, visibility, pinned, archived
			FROM memos
			${where}
			ORDER BY pinned DESC, created_at DESC
		`,
    bindings,
  };
}

export async function listMemos(
  db: D1Database,
  cache: KVNamespace,
  filters: MemoListFilters = {},
): Promise<Memo[]> {
  const shouldCache =
    !filters.search && !filters.date && !filters.tags?.length && !filters.archivedOnly;

  if (shouldCache) {
    const cached = await cache.get("memo:list");
    if (cached) return JSON.parse(cached) as Memo[];
  }

  const { sql, bindings } = buildListQuery(filters);
  const { results } = await db
    .prepare(sql)
    .bind(...bindings)
    .all<MemoRow>();
  const memos = (results ?? []).map(rowToMemo);

  if (shouldCache) {
    await cache.put("memo:list", JSON.stringify(memos));
  }

  return memos;
}

export async function listTagCounts(db: D1Database, cache: KVNamespace): Promise<TagCount[]> {
  const cached = await cache.get("memo:tags", "json");
  if (cached) return cached as TagCount[];

  const { results } = await db
    .prepare(
      `
			SELECT lower(json_each.value) AS name, COUNT(*) AS count
			FROM memos, json_each(memos.tags_json)
			WHERE archived = 0
			GROUP BY lower(json_each.value)
			ORDER BY count DESC, name ASC
		`,
    )
    .all<{ name: string; count: number }>();

  const tags = (results ?? []).map((row) => ({ name: row.name, count: Number(row.count) }));
  await cache.put("memo:tags", JSON.stringify(tags));
  return tags;
}

export async function createMemo(
  db: D1Database,
  bucket: R2Bucket,
  cache: KVNamespace,
  input: CreateMemoInput,
): Promise<Memo> {
  const now = new Date();
  const id = createMemoId(now);
  const tags = input.tags.length ? input.tags : normalizeTags(input.content);
  const r2Key = buildMemoR2Key(id, now);
  const content = input.content.trim();
  const excerpt = content.length > 300 ? content.slice(0, 300).trimEnd() : content;
  const nowIso = now.toISOString();

  await bucket.put(r2Key, content, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
  });

  await db
    .prepare(
      `
			INSERT INTO memos (id, r2_key, tags_json, excerpt, created_at, updated_at, visibility, pinned, archived)
			VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)
		`,
    )
    .bind(id, r2Key, JSON.stringify(tags), excerpt, nowIso, nowIso, input.visibility)
    .run();

  await Promise.all([cache.delete("memo:list"), cache.delete("memo:tags")]);

  return {
    id,
    r2Key,
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
  db: D1Database,
  bucket: R2Bucket,
  cache: KVNamespace,
  id: string,
  input: UpdateMemoInput,
): Promise<Memo> {
  const existing = await db.prepare("SELECT * FROM memos WHERE id = ?").bind(id).first<MemoRow>();
  if (!existing) throw new Error(`Memo not found: ${id}`);

  const setClauses: string[] = [];
  const bindings: unknown[] = [];

  if (input.content !== undefined) {
    const content = input.content.trim();
    const excerpt = content.length > 300 ? content.slice(0, 300).trimEnd() : content;
    await bucket.put(existing.r2_key, content, {
      httpMetadata: { contentType: "text/markdown; charset=utf-8" },
    });
    setClauses.push("excerpt = ?");
    bindings.push(excerpt);
  }

  if (input.tags !== undefined) {
    const tags = input.tags.length
      ? input.tags
      : input.content !== undefined
        ? normalizeTags(input.content.trim())
        : (JSON.parse(existing.tags_json) as string[]);
    setClauses.push("tags_json = ?");
    bindings.push(JSON.stringify(tags));
  }

  if (input.visibility !== undefined) {
    setClauses.push("visibility = ?");
    bindings.push(input.visibility);
  }

  if (input.pinned !== undefined) {
    setClauses.push("pinned = ?");
    bindings.push(input.pinned ? 1 : 0);
  }

  if (input.archived !== undefined) {
    setClauses.push("archived = ?");
    bindings.push(input.archived ? 1 : 0);
  }

  const updatedAt = new Date().toISOString();
  setClauses.push("updated_at = ?");
  bindings.push(updatedAt);
  bindings.push(id);

  await db
    .prepare(`UPDATE memos SET ${setClauses.join(", ")} WHERE id = ?`)
    .bind(...bindings)
    .run();

  await Promise.all([cache.delete("memo:list"), cache.delete("memo:tags")]);

  const updated = await db.prepare("SELECT * FROM memos WHERE id = ?").bind(id).first<MemoRow>();

  return rowToMemo(updated!);
}

export async function deleteMemo(
  db: D1Database,
  bucket: R2Bucket,
  cache: KVNamespace,
  id: string,
): Promise<void> {
  const existing = await db
    .prepare("SELECT r2_key FROM memos WHERE id = ?")
    .bind(id)
    .first<Pick<MemoRow, "r2_key">>();
  if (!existing) throw new Error(`Memo not found: ${id}`);

  await db.prepare("DELETE FROM memos WHERE id = ?").bind(id).run();
  await bucket.delete(existing.r2_key);
  await Promise.all([cache.delete("memo:list"), cache.delete("memo:tags")]);
}
