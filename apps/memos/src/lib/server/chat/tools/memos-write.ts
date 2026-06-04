import { tool } from "ai";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { memos } from "$lib/server/db/schema";
import { createMemoId, buildMemoR2Key, normalizeTags } from "$lib/server/memos/utils";
import { stripHashtags } from "$lib/utils";
import type { R2Bucket } from "@cloudflare/workers-types";

export interface MemoWriteContext {
  db: DrizzleD1Database;
  bucket: R2Bucket;
  invalidateCache: () => Promise<void[]>;
}

export function createMemoWriteTools(ctx: MemoWriteContext) {
  const { db, bucket, invalidateCache } = ctx;

  const create_memo = tool({
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

      await bucket.put(r2Key, trimmed, {
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
  });

  const update_memo = tool({
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
        await bucket.put(existing.r2Key, trimmed, {
          httpMetadata: { contentType: "text/markdown; charset=utf-8" },
        });
        setValues.excerpt = trimmed;
        setValues.tagsJson = tags?.length ? tags : normalizeTags(trimmed);
      } else if (tags !== undefined) {
        const newTags = tags.length ? tags : [];
        setValues.tagsJson = newTags;

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

      if (visibility !== undefined) setValues.visibility = visibility;
      if (pinned !== undefined) setValues.pinned = pinned;
      if (archived !== undefined) setValues.archived = archived;

      if (!Object.keys(setValues).length) return "No changes specified.";

      setValues.updatedAt = new Date().toISOString();
      await db.update(memos).set(setValues).where(eq(memos.id, id));
      await invalidateCache();

      return `Memo ${id} updated.`;
    },
  });

  const delete_memo = tool({
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
      await bucket.delete(existing.r2Key);
      await invalidateCache();

      return `Memo ${id} deleted.`;
    },
  });

  return { create_memo, update_memo, delete_memo };
}
