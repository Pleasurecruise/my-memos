import { tool } from "ai";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq, like, sql } from "drizzle-orm";
import { memos } from "$lib/server/db/schema";
import { listTagCounts } from "$lib/server/memos/repository";
import { createMemoId, buildMemoR2Key, normalizeTags } from "$lib/server/memos/utils";

type Env = NonNullable<App.Platform>["env"];

export function createChatTools(env: Env) {
  const { DB, MEMOS_BUCKET, MEMOS_CACHE, TAVILY_API_KEY } = env;
  const db = drizzle(DB);

  const invalidateCache = () =>
    Promise.all([
      MEMOS_CACHE.delete("memo:list"),
      MEMOS_CACHE.delete("memo:list:public"),
      MEMOS_CACHE.delete("memo:tags"),
      MEMOS_CACHE.delete("memo:tags:public"),
    ]);

  return {
    get_tags: tool({
      description:
        "List all tags the user has used, with memo counts. Call this first whenever the user mentions tags or wants to filter by a tag — so you know the exact tag names before filtering.",
      inputSchema: z.object({}),
      execute: async () => {
        const tags = await listTagCounts(DB, MEMOS_CACHE);
        if (!tags.length) return "No tags found.";
        return tags.map((t) => `${t.name} (${t.count})`).join(", ");
      },
    }),

    list_memos: tool({
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

        if (from_date) conditions.push(sql`substr(${memos.createdAt}, 1, 10) >= ${from_date}`);
        if (to_date) conditions.push(sql`substr(${memos.createdAt}, 1, 10) <= ${to_date}`);
        if (tags?.length) {
          for (const tag of tags) {
            conditions.push(
              sql`EXISTS (SELECT 1 FROM json_each(memos.tags_json) WHERE lower(json_each.value) = lower(${tag}))`,
            );
          }
        }

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

        return rows
          .map(
            (row) =>
              `id: ${row.id}\n[${row.createdAt.slice(0, 10)}] tags: ${row.tagsJson.join(", ") || "none"}\n${row.excerpt}`,
          )
          .join("\n\n---\n\n");
      },
    }),

    search_memos: tool({
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
        tags: z
          .array(z.string())
          .optional()
          .describe("Also filter by these tags (case-insensitive)"),
      }),
      execute: async ({ query, from_date, to_date, tags }) => {
        const conditions = [eq(memos.archived, false), like(memos.excerpt, `%${query}%`)];

        if (from_date) conditions.push(sql`substr(${memos.createdAt}, 1, 10) >= ${from_date}`);
        if (to_date) conditions.push(sql`substr(${memos.createdAt}, 1, 10) <= ${to_date}`);
        if (tags?.length) {
          for (const tag of tags) {
            conditions.push(
              sql`EXISTS (SELECT 1 FROM json_each(memos.tags_json) WHERE lower(json_each.value) = lower(${tag}))`,
            );
          }
        }

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
            const obj = await MEMOS_BUCKET.get(row.r2Key);
            return obj ? await obj.text() : row.excerpt;
          }),
        );

        return rows
          .map(
            (row, i) =>
              `id: ${row.id}\n[${row.createdAt.slice(0, 10)}] tags: ${row.tagsJson.join(", ") || "none"}\n${bodies[i]}`,
          )
          .join("\n\n---\n\n");
      },
    }),

    create_memo: tool({
      description:
        "Create a new memo for the user. Use when the user asks to save, record, add, or write a new memo/note. Tags are auto-extracted from #hashtags in content if not explicitly provided.",
      inputSchema: z.object({
        content: z.string().describe("Full memo content in markdown"),
        tags: z
          .array(z.string())
          .optional()
          .describe("Tags for the memo — auto-extracted from #hashtags if omitted"),
        visibility: z
          .enum(["private", "public"])
          .default("private")
          .describe("Visibility (default: private)"),
      }),
      execute: async ({ content, tags, visibility }) => {
        const now = new Date();
        const id = createMemoId(now);
        const r2Key = buildMemoR2Key(id, now);
        const trimmed = content.trim();
        const finalTags = tags?.length ? tags : normalizeTags(trimmed);
        const nowIso = now.toISOString();

        await MEMOS_BUCKET.put(r2Key, trimmed, {
          httpMetadata: { contentType: "text/markdown; charset=utf-8" },
        });
        await db.insert(memos).values({
          id,
          r2Key,
          tagsJson: finalTags,
          excerpt: trimmed,
          createdAt: nowIso,
          updatedAt: nowIso,
          visibility,
          pinned: false,
          archived: false,
        });
        await invalidateCache();

        return `Memo created. id: ${id}, tags: ${finalTags.join(", ") || "none"}.`;
      },
    }),

    update_memo: tool({
      description:
        "Update an existing memo's content, tags, visibility, pinned, or archived status. Obtain memo IDs from list_memos or search_memos first. When updating content, tags are re-extracted from #hashtags unless explicitly provided.",
      inputSchema: z.object({
        id: z.string().describe("Memo ID to update"),
        content: z.string().optional().describe("New full content (replaces existing)"),
        tags: z
          .array(z.string())
          .optional()
          .describe(
            "New tags (replaces existing; auto-extracted from content #hashtags if content is provided and tags omitted)",
          ),
        visibility: z.enum(["private", "public"]).optional(),
        pinned: z.boolean().optional(),
        archived: z.boolean().optional(),
      }),
      execute: async ({ id, content, tags, visibility, pinned, archived }) => {
        const [existing] = await db.select().from(memos).where(eq(memos.id, id)).limit(1);
        if (!existing) return `Memo not found: ${id}`;

        const setValues: Partial<typeof memos.$inferInsert> = {};

        if (content !== undefined) {
          const trimmed = content.trim();
          await MEMOS_BUCKET.put(existing.r2Key, trimmed, {
            httpMetadata: { contentType: "text/markdown; charset=utf-8" },
          });
          setValues.excerpt = trimmed;
          setValues.tagsJson = tags?.length ? tags : normalizeTags(trimmed);
        } else if (tags !== undefined) {
          setValues.tagsJson = tags;
        }

        if (visibility !== undefined) setValues.visibility = visibility;
        if (pinned !== undefined) setValues.pinned = pinned;
        if (archived !== undefined) setValues.archived = archived;

        if (!Object.keys(setValues).length) return "No changes specified.";

        setValues.updatedAt = new Date().toISOString();
        await db.update(memos).set(setValues).where(eq(memos.id, id));
        await invalidateCache();

        return `Memo ${id} updated.`;
      },
    }),

    delete_memo: tool({
      description:
        "Permanently delete a memo. This cannot be undone — always confirm with the user before calling. Obtain memo IDs from list_memos or search_memos first.",
      inputSchema: z.object({
        id: z.string().describe("Memo ID to delete"),
      }),
      execute: async ({ id }) => {
        const [existing] = await db
          .select({ r2Key: memos.r2Key })
          .from(memos)
          .where(eq(memos.id, id))
          .limit(1);
        if (!existing) return `Memo not found: ${id}`;

        await db.delete(memos).where(eq(memos.id, id));
        await MEMOS_BUCKET.delete(existing.r2Key);
        await invalidateCache();

        return `Memo ${id} deleted.`;
      },
    }),

    web_search: tool({
      description:
        "Search the web for up-to-date information. Use when the user asks about current events, facts, or anything not likely to be in their memos.",
      inputSchema: z.object({
        query: z.string().describe("Search query"),
        max_results: z
          .number()
          .int()
          .min(1)
          .max(10)
          .default(5)
          .describe("Number of results to return (default 5)"),
      }),
      execute: async ({ query, max_results }) => {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query,
            max_results,
            include_answer: true,
          }),
        });
        const data = (await res.json()) as {
          answer?: string;
          results: { title: string; url: string; content: string }[];
        };

        const parts: string[] = [];
        if (data.answer) parts.push(`Summary: ${data.answer}`);
        parts.push(...data.results.map((r) => `[${r.title}](${r.url})\n${r.content}`));
        return parts.join("\n\n---\n\n") || "No results found.";
      },
    }),

    update_memory: tool({
      description:
        "Overwrite the long-term memory file with updated information about the user. Call this when you learn something worth remembering across conversations.",
      inputSchema: z.object({
        content: z.string().describe("Full new markdown content for the memory file"),
      }),
      execute: async ({ content }) => {
        await MEMOS_BUCKET.put("agent/MEMORY.md", content, {
          httpMetadata: { contentType: "text/markdown; charset=utf-8" },
        });
        return "Memory updated.";
      },
    }),
  };
}
