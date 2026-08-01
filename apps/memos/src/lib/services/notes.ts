import { z } from "zod";
import { encodeSlug } from "$lib/utils/url";

const noteUpdateResponseSchema = z.object({
  note: z.object({
    html: z.string(),
    toc: z.array(z.object({ depth: z.number(), text: z.string(), id: z.string() })),
    excerpt: z.string(),
    title: z.string(),
    slug: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    source: z.string(),
    editorHtml: z.string(),
  }),
});

const errorResponseSchema = z.object({ error: z.string().min(1) });

export type NoteUpdateResponse = z.infer<typeof noteUpdateResponseSchema>;

interface NoteInput {
  body: string;
  title: string;
  category: string;
}

async function extractError(res: Response): Promise<string> {
  try {
    const result = errorResponseSchema.safeParse(await res.json());
    return result.success ? result.data.error : "Request failed.";
  } catch {
    return "Request failed.";
  }
}

async function parseNoteResponse(res: Response): Promise<NoteUpdateResponse> {
  const result = noteUpdateResponseSchema.safeParse(await res.json());
  if (!result.success) throw new Error("Invalid API response.");
  return result.data;
}

export async function apiCreateNote(input: NoteInput): Promise<NoteUpdateResponse> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) throw new Error(await extractError(res));

  return parseNoteResponse(res);
}

export async function apiUpdateNote(slug: string, input: NoteInput): Promise<NoteUpdateResponse> {
  const res = await fetch(`/api/notes/${encodeSlug(slug)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) throw new Error(await extractError(res));

  return parseNoteResponse(res);
}

export async function apiDeleteNote(slug: string): Promise<void> {
  const res = await fetch(`/api/notes/${encodeSlug(slug)}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error(await extractError(res));
}
