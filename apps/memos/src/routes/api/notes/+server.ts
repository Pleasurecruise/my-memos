import { json } from "@sveltejs/kit";
import { z } from "zod";
import { createNote, NoteError } from "$lib/server/notes";
import type { RequestHandler } from "./$types";

const createNoteSchema = z.object({
  body: z.string(),
  title: z.string().trim().min(1),
  category: z.string().trim(),
});

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!platform) {
    return json({ error: "Cloudflare platform bindings are unavailable." }, { status: 500 });
  }

  const result = createNoteSchema.safeParse(await request.json());
  if (!result.success) {
    return json({ error: "Note title is required." }, { status: 400 });
  }

  try {
    const note = await createNote(
      { bucket: platform.env.MEMOS_BUCKET, cache: platform.env.MEMOS_CACHE },
      result.data,
    );
    return json({ note }, { status: 201 });
  } catch (error) {
    if (!(error instanceof NoteError)) throw error;
    const status =
      error.code === "invalid_input" ? 400 : error.code === "already_exists" ? 409 : 500;
    return json({ error: error.message }, { status });
  }
};
