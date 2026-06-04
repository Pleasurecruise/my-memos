import { tool } from "ai";
import { z } from "zod";
import { and, desc, eq, like } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { memos } from "$lib/server/db/schema";
import { buildMemoDateCondition, buildMemoTagConditions, listTagCounts } from "$lib/server/memos";
import type { D1Database, KVNamespace, R2Bucket } from "@cloudflare/workers-types";

export interface MemoReadContext {
  d1: D1Database;
  db: DrizzleD1Database;
  bucket: R2Bucket;
  cache: KVNamespace;
}

function formatMemoRow(
  row: { id: string; createdAt: string; tagsJson: string[] },
  body: string,
): string {
  return `id: ${row.id}\n[${row.createdAt.slice(0, 10)}] tags: ${row.tagsJson.join(", ") || "none"}\n${body}`;
}

export function createMemoReadTools(ctx: MemoReadContext) {
  const { d1, db, bucket, cache } = ctx;

  const get_tags = tool({
    description:
      "List all tags the user has used, with memo counts. Call this first whenever the user mentions tags or wants to filter by a tag — so you know the exact tag names before filtering.",
    inputSchema: z.object({}),
    execute: async () => {
      const tags = await listTagCounts(d1, cache);
      if (!tags.length) return "No tags found.";
      return tags.map((t) => `${t.name} (${t.count})`).join(", ");
    },
  });

  const list_memos = tool({
    description:
      "Browse memos by time range and/or tags without needing keywords. Use for temporal questions ('最近', '今天', '上周', '这个月', '3月份') or tag-based browsing. Returns excerpts and IDs. When the user mentions a tag, call get_tags first to confirm the exact name.",
    inputSchema: z.object({
      from_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe("Start date (YYYY-MM-DD), inclusive"),
      to_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe("End date (YYYY-MM-DD), inclusive"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Filter by these tags (case-insensitive, all must match)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(20)
        .default(10)
        .describe("Number of memos to return (default 10)"),
    }),
    execute: async ({ from_date, to_date, tags, limit }) => {
      const conditions = [eq(memos.archived, false)];

      if (from_date) conditions.push(buildMemoDateCondition(memos.createdAt, from_date, ">="));
      if (to_date) conditions.push(buildMemoDateCondition(memos.createdAt, to_date, "<="));
      if (tags?.length) conditions.push(...buildMemoTagConditions(tags));

      const rows = await db
        .select({
          id: memos.id,
          excerpt: memos.excerpt,
          tagsJson: memos.tagsJson,
          createdAt: memos.createdAt,
        })
        .from(memos)
        .where(and(...conditions))
        .orderBy(desc(memos.createdAt))
        .limit(limit);

      if (!rows.length) return "No memos found.";

      return rows.map((row) => formatMemoRow(row, row.excerpt)).join("\n\n---\n\n");
    },
  });

  const search_memos = tool({
    description:
      "Search memos by keyword. Use when the user asks about a specific topic, person, or event. Returns full memo content and IDs. Combine with from_date/to_date for time-scoped searches, or tags to narrow down further. For pure time/tag browsing without keywords, use list_memos instead.",
    inputSchema: z.object({
      query: z.string().describe("Keywords to search for in memo content"),
      from_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe("Start date (YYYY-MM-DD), inclusive"),
      to_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe("End date (YYYY-MM-DD), inclusive"),
      tags: z.array(z.string()).optional().describe("Also filter by these tags (case-insensitive)"),
    }),
    execute: async ({ query, from_date, to_date, tags }) => {
      const conditions = [eq(memos.archived, false), like(memos.excerpt, `%${query}%`)];

      if (from_date) conditions.push(buildMemoDateCondition(memos.createdAt, from_date, ">="));
      if (to_date) conditions.push(buildMemoDateCondition(memos.createdAt, to_date, "<="));
      if (tags?.length) conditions.push(...buildMemoTagConditions(tags));

      const rows = await db
        .select({
          id: memos.id,
          r2Key: memos.r2Key,
          excerpt: memos.excerpt,
          tagsJson: memos.tagsJson,
          createdAt: memos.createdAt,
        })
        .from(memos)
        .where(and(...conditions))
        .orderBy(desc(memos.createdAt))
        .limit(10);

      if (!rows.length) return "No memos found.";

      const bodies = await Promise.all(
        rows.map(async (row) => {
          const obj = await bucket.get(row.r2Key);
          return obj ? await obj.text() : row.excerpt;
        }),
      );

      return rows.map((row, i) => formatMemoRow(row, bodies[i])).join("\n\n---\n\n");
    },
  });

  return { get_tags, list_memos, search_memos };
}
