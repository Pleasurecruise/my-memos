import type { Memo, MemoVisibility } from "$lib/types";
import { z } from "zod";

const memoSchema = z.object({
  id: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  visibility: z.enum(["public", "private"]),
  pinned: z.boolean(),
  archived: z.boolean(),
});

const memoPageSchema = z.object({
  memos: z.array(memoSchema),
  nextCursor: z.string().nullable(),
});

export interface MemoPage {
  memos: Memo[];
  nextCursor: string | null;
}

export interface MemoUpdateInput {
  content?: string;
  visibility?: MemoVisibility;
  tags?: string[];
  pinned?: boolean;
  archived?: boolean;
}

async function extractError(res: Response): Promise<string> {
  try {
    const payload = (await res.json()) as { error?: string };
    return payload.error ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export async function apiCreateMemo(content: string, visibility: MemoVisibility): Promise<void> {
  const res = await fetch("/api/memos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content, visibility }),
  });
  if (!res.ok) throw new Error(await extractError(res));
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
