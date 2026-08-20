import type { Memo, MemoVisibility } from "$lib/types";
import { z } from "zod";

export const memoSchema = z.object({
  id: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  visibility: z.enum(["public", "private"]),
  pinned: z.boolean(),
  favorite: z.boolean(),
  archived: z.boolean(),
});

const memoPageSchema = z.object({
  memos: z.array(memoSchema),
  nextCursor: z.string().nullable(),
});

const errorResponseSchema = z.object({ error: z.string().min(1) });

export interface MemoPage {
  memos: Memo[];
  nextCursor: string | null;
}

export interface MemoUpdateInput {
  content?: string;
  visibility?: MemoVisibility;
  tags?: string[];
  pinned?: boolean;
  favorite?: boolean;
  archived?: boolean;
}

async function extractError(res: Response): Promise<string> {
  return errorResponseSchema.parse(await res.json()).error;
}

export async function apiCreateMemo(content: string, visibility: MemoVisibility): Promise<void> {
  const res = await fetch("/api/memos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content, visibility }),
  });
  if (!res.ok) throw new Error(await extractError(res));
}

export async function apiImportXPost(
  url: string,
  visibility: MemoVisibility,
): Promise<{ success: true } | { success: false; error: string }> {
  const res = await fetch("/api/memos/import/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, visibility }),
  });
  if (!res.ok) return { success: false, error: await extractError(res) };
  return { success: true };
}

export async function apiListMemos(url: string): Promise<MemoPage> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await extractError(res));
  return memoPageSchema.parse(await res.json());
}

export async function apiUpdateMemo(id: string, input: MemoUpdateInput): Promise<void> {
  const res = await fetch(`/api/memos/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await extractError(res));
}

export async function apiDeleteMemo(id: string): Promise<void> {
  const res = await fetch(`/api/memos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await extractError(res));
}
