import type { TocEntry } from "$lib/types";

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

function encodeSlug(slug: string): string {
  return slug
    .replace(/\.md$/i, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export async function apiUpdateNote(slug: string, content: string): Promise<NoteUpdateResponse> {
  const res = await fetch(`/api/notes/${encodeSlug(slug)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) throw new Error(await extractError(res));

  const raw: unknown = await res.json();
  if (!raw || typeof raw !== "object" || !("note" in raw)) {
    throw new Error("Invalid API response.");
  }
  return raw as NoteUpdateResponse;
}
