import { json } from "@sveltejs/kit";
import { z } from "zod";
import {
  compileEditorHtml,
  compileMarkdown,
  DEFAULT_NOTE_CATEGORY,
  deleteCategoriesKv,
  r2KeyFromSlug,
  stripLeadingTitleHeading,
  writeNoteKv,
} from "$lib/server/blog";
import { normalizeUrlPathSegment } from "$lib/utils/url";
import type { RequestHandler } from "./$types";

const createNoteSchema = z.object({
  body: z.string(),
  title: z.string().trim().min(1),
  category: z.string().trim(),
});

function noteFileName(title: string): string {
  return normalizeUrlPathSegment(title || "untitled-note") || "untitled-note";
}

function noteSlug(category: string, title: string): string {
  const cat = normalizeUrlPathSegment(category || DEFAULT_NOTE_CATEGORY) || DEFAULT_NOTE_CATEGORY;
  return `${cat}/${noteFileName(title)}`;
}

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

  const bucket = platform.env.MEMOS_BUCKET;
  const kv = platform.env.MEMOS_CACHE;
  const title = result.data.title;
  const source = stripLeadingTitleHeading(result.data.body).trimEnd() + "\n";
  const slug = noteSlug(result.data.category, title);
  const r2Key = r2KeyFromSlug(slug);

  const existing = await bucket.head(r2Key);
  if (existing) {
    return json({ error: `Note "${slug}" already exists.` }, { status: 409 });
  }

  const savedAt = new Date().toISOString();
  const compiled = await compileMarkdown(source);

  const putResult = await bucket.put(r2Key, source, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
    customMetadata: {
      createdAt: savedAt,
      updatedAt: savedAt,
      title,
    },
  });

  if (!putResult) {
    return json({ error: "Failed to create note." }, { status: 500 });
  }

  const uploadedAt = putResult.uploaded.toISOString();
  await writeNoteKv(kv, slug, uploadedAt, title, compiled, source);
  await deleteCategoriesKv(kv);

  return json(
    {
      note: {
        html: compiled.html,
        toc: compiled.toc,
        excerpt: compiled.excerpt,
        title,
        slug,
        createdAt: savedAt,
        updatedAt: savedAt,
        source,
        editorHtml: await compileEditorHtml(source),
      },
    },
    { status: 201 },
  );
};
