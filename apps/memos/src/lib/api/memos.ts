import type { MemoVisibility } from "$lib/types/memos";

export interface MemoUpdateInput {
  content?: string;
  visibility?: MemoVisibility;
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
