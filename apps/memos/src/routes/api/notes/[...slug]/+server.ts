import { json } from "@sveltejs/kit";
import { z } from "zod";
import {
  compileEditorHtml,
  compileMarkdown,
  DEFAULT_NOTE_CATEGORY,
  deleteCategoriesKv,
  deleteNoteKv,
  normalizeNoteSlug,
  r2KeyFromSlug,
  stripLeadingTitleHeading,
  writeNoteKv,
} from "$lib/server/blog";
import { normalizeUrlPathSegment } from "$lib/utils/url";
import type { RequestHandler } from "./$types";

const updateNoteSchema = z.object({
  body: z.string(),
  title: z.string().trim().min(1),
  category: z.string().trim(),
});

function nextNoteSlug(category: string, title: string): string {
  const base = normalizeUrlPathSegment(title || "untitled-note") || "untitled-note";
  const cat = normalizeUrlPathSegment(category || DEFAULT_NOTE_CATEGORY) || DEFAULT_NOTE_CATEGORY;
  return `${cat}/${base}`;
}

export const PATCH: RequestHandler = async ({ request, params, platform, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!platform) {
    return json({ error: "Cloudflare platform bindings are unavailable." }, { status: 500 });
  }

  const currentSlug = normalizeNoteSlug(params.slug);
  if (!currentSlug) {
    return json({ error: "Note path is required." }, { status: 400 });
  }

  const result = updateNoteSchema.safeParse(await request.json());
  if (!result.success) {
    return json({ error: "Note title is required." }, { status: 400 });
  }

  const bucket = platform.env.MEMOS_BUCKET;
  const kv = platform.env.MEMOS_CACHE;
  const r2Key = r2KeyFromSlug(currentSlug);
  const nextSlug = nextNoteSlug(result.data.category, result.data.title);
  const nextR2Key = r2KeyFromSlug(nextSlug);
  const existing = await bucket.head(r2Key);

  if (!existing) {
    return json({ error: `Note "${currentSlug}" not found.` }, { status: 404 });
  }

  if (nextSlug !== currentSlug && (await bucket.head(nextR2Key))) {
    return json({ error: `Note "${nextSlug}" already exists.` }, { status: 409 });
  }

  const title = result.data.title;
  const source = stripLeadingTitleHeading(result.data.body).trimEnd() + "\n";
  const savedAt = new Date().toISOString();
  const createdAt = existing.customMetadata?.createdAt ?? existing.uploaded.toISOString();

  const compiled = await compileMarkdown(source);

  const putResult = await bucket.put(nextR2Key, source, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
    customMetadata: {
      ...existing.customMetadata,
      createdAt,
      updatedAt: savedAt,
      title,
    },
  });

  if (!putResult) {
    return json({ error: "Failed to save note." }, { status: 500 });
  }

  const uploadedAt = putResult.uploaded.toISOString();
  await writeNoteKv(kv, nextSlug, uploadedAt, title, compiled, source);

  if (nextSlug !== currentSlug) {
    await bucket.delete(r2Key);
    await deleteNoteKv(kv, currentSlug);
  }

  await deleteCategoriesKv(kv);

  return json({
    note: {
      html: compiled.html,
      toc: compiled.toc,
      excerpt: compiled.excerpt,
      title,
      slug: nextSlug,
      createdAt,
      updatedAt: savedAt,
      source,
      editorHtml: await compileEditorHtml(source),
    },
  });
};

export const DELETE: RequestHandler = async ({ params, platform, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!platform) {
    return json({ error: "Cloudflare platform bindings are unavailable." }, { status: 500 });
  }

  const slug = normalizeNoteSlug(params.slug);
  if (!slug) {
    return json({ error: "Note path is required." }, { status: 400 });
  }

  const bucket = platform.env.MEMOS_BUCKET;
  const kv = platform.env.MEMOS_CACHE;
  const r2Key = r2KeyFromSlug(slug);
  const existing = await bucket.head(r2Key);

  if (!existing) {
    return json({ error: `Note "${slug}" not found.` }, { status: 404 });
  }

  await bucket.delete(r2Key);
  await deleteNoteKv(kv, slug);
  await deleteCategoriesKv(kv);

  return new Response(null, { status: 204 });
};
