import type { TocEntry } from "$lib/types";
import { encodeSlug } from "$lib/utils/url";

export interface NoteUpdateResponse {
  note: {
    html: string;
    toc: TocEntry[];
    excerpt: string;
    title: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    source: string;
    editorHtml: string;
  };
}

interface NoteInput {
  body: string;
  title: string;
  category: string;
}

async function extractError(res: Response): Promise<string> {
  try {
    const raw: unknown = await res.json();
    if (raw && typeof raw === "object" && "error" in raw) {
      return String((raw as Record<string, unknown>).error) || "Request failed.";
    }
    return "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export async function apiCreateNote(input: NoteInput): Promise<NoteUpdateResponse> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) throw new Error(await extractError(res));

  const raw: unknown = await res.json();
  if (!raw || typeof raw !== "object" || !("note" in raw)) {
    throw new Error("Invalid API response.");
  }
  return raw as NoteUpdateResponse;
}

export async function apiUpdateNote(slug: string, input: NoteInput): Promise<NoteUpdateResponse> {
  const res = await fetch(`/api/notes/${encodeSlug(slug)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) throw new Error(await extractError(res));

  const raw: unknown = await res.json();
  if (!raw || typeof raw !== "object" || !("note" in raw)) {
    throw new Error("Invalid API response.");
  }
  return raw as NoteUpdateResponse;
}

export async function apiDeleteNote(slug: string): Promise<void> {
  const res = await fetch(`/api/notes/${encodeSlug(slug)}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error(await extractError(res));
}
