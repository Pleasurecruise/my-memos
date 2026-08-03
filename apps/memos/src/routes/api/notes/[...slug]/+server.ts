import { json } from "@sveltejs/kit";
import { z } from "zod";
import { deleteNote, NoteError, updateNote } from "$lib/server/notes";
import type { RequestHandler } from "./$types";

const updateNoteSchema = z.object({
  body: z.string(),
  title: z.string().trim().min(1),
  category: z.string().trim(),
});

function noteErrorResponse(error: NoteError) {
  const status =
    error.code === "invalid_input"
      ? 400
      : error.code === "not_found"
        ? 404
        : error.code === "already_exists"
          ? 409
          : 500;
  return json({ error: error.message }, { status });
}

export const PATCH: RequestHandler = async ({ request, params, platform, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!platform) {
    return json({ error: "Cloudflare platform bindings are unavailable." }, { status: 500 });
  }

  if (!params.slug) {
    return json({ error: "Note path is required." }, { status: 400 });
  }

  const result = updateNoteSchema.safeParse(await request.json());
  if (!result.success) {
    return json({ error: "Note title is required." }, { status: 400 });
  }

  try {
    const note = await updateNote(
      { bucket: platform.env.MEMOS_BUCKET, cache: platform.env.MEMOS_CACHE },
      params.slug,
      result.data,
    );
    return json({ note });
  } catch (error) {
    if (!(error instanceof NoteError)) throw error;
    return noteErrorResponse(error);
  }
};

export const DELETE: RequestHandler = async ({ params, platform, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!platform) {
    return json({ error: "Cloudflare platform bindings are unavailable." }, { status: 500 });
  }

  if (!params.slug) {
    return json({ error: "Note path is required." }, { status: 400 });
  }

  try {
    await deleteNote(
      { bucket: platform.env.MEMOS_BUCKET, cache: platform.env.MEMOS_CACHE },
      params.slug,
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    if (!(error instanceof NoteError)) throw error;
    return noteErrorResponse(error);
  }
};
