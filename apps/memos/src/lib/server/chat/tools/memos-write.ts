import { tool } from "ai";
import { z } from "zod";
import { createMemo, deleteMemo, updateMemo } from "$lib/server/memos";
import type { D1Database, KVNamespace, R2Bucket } from "@cloudflare/workers-types";

export interface MemoWriteContext {
  d1: D1Database;
  bucket: R2Bucket;
  cache: KVNamespace;
}

export function createMemoWriteTools(ctx: MemoWriteContext) {
  const { d1, bucket, cache } = ctx;

  const create_memo = tool({
    description:
      "Create a new memo for the user. Use when the user asks to save, record, add, or write a new memo/note. Tags are auto-extracted from #hashtags in content if not explicitly provided.",
    inputSchema: z.object({
      content: z.string().describe("Full memo content in markdown"),
      tags: z
        .array(z.string())
        .default([])
        .describe("Tags for the memo — auto-extracted from #hashtags if omitted"),
      visibility: z
        .enum(["private", "public"])
        .default("private")
        .describe("Visibility (default: private)"),
    }),
    execute: async ({ content, tags, visibility }) => {
      const memo = await createMemo(d1, bucket, cache, {
        content,
        tags,
        visibility,
      });

      return `Memo created. id: ${memo.id}, tags: ${memo.tags.join(", ") || "none"}.`;
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
      if (
        content === undefined &&
        tags === undefined &&
        visibility === undefined &&
        pinned === undefined &&
        archived === undefined
      ) {
        return "No changes specified.";
      }

      return updateMemo(d1, bucket, cache, id, { content, tags, visibility, pinned, archived })
        .then(() => `Memo ${id} updated.`)
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : `Failed to update memo: ${id}`;
          return message.includes("not found") ? `Memo not found: ${id}` : message;
        });
    },
  });

  const delete_memo = tool({
    description:
      "Permanently delete a memo. This cannot be undone — always confirm with the user before calling. Obtain memo IDs from list_memos or search_memos first.",
    inputSchema: z.object({
      id: z.string().describe("Memo ID to delete"),
    }),
    execute: ({ id }) => {
      return deleteMemo(d1, bucket, cache, id)
        .then(() => `Memo ${id} deleted.`)
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : `Failed to delete memo: ${id}`;
          return message.includes("not found") ? `Memo not found: ${id}` : message;
        });
    },
  });

  return { create_memo, update_memo, delete_memo };
}
