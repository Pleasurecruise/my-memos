import { json } from "@sveltejs/kit";
import { z } from "zod";
import {
  compileEditorHtml,
  compileMarkdown,
  extractTitle,
  r2KeyFromSlug,
  slugToTitle,
  writeNoteKv,
} from "$lib/server/blog";
import type { RequestHandler } from "./$types";

const updateNoteSchema = z.object({
  content: z.string().trim().min(1),
});

function normalizeSlug(rawSlug: string): string {
  return rawSlug
    .replace(/\.md$/i, "")
    .split("/")
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");
}

export const PATCH: RequestHandler = async ({ request, params, platform, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!platform) {
    return json({ error: "Cloudflare platform bindings are unavailable." }, { status: 500 });
  }

  const slug = normalizeSlug(params.slug);
  if (!slug) {
    return json({ error: "Note path is required." }, { status: 400 });
  }

  const result = updateNoteSchema.safeParse(await request.json());
  if (!result.success) {
    return json({ error: "Note content cannot be empty." }, { status: 400 });
  }

  const bucket = platform.env.MEMOS_BUCKET;
  const kv = platform.env.MEMOS_CACHE;
  const r2Key = r2KeyFromSlug(slug);
  const existing = await bucket.head(r2Key);

  if (!existing) {
    return json({ error: `Note "${slug}" not found.` }, { status: 404 });
  }

  const source = result.data.content.trimEnd() + "\n";
  const savedAt = new Date().toISOString();
  const createdAt = existing.customMetadata?.createdAt ?? existing.uploaded.toISOString();
  const title = extractTitle(source) || slugToTitle(slug);

  const compiled = await compileMarkdown(source);

  const putResult = await bucket.put(r2Key, source, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
    customMetadata: {
      ...existing.customMetadata,
      createdAt,
      updatedAt: savedAt,
    },
  });

  if (!putResult) {
    return json({ error: "Failed to save note." }, { status: 500 });
  }

  const uploadedAt = putResult.uploaded.toISOString();
  await writeNoteKv(kv, slug, uploadedAt, title, compiled, source);

  return json({
    note: {
      html: compiled.html,
      toc: compiled.toc,
      excerpt: compiled.excerpt,
      title,
      slug,
      createdAt,
      updatedAt: savedAt,
      source,
      editorHtml: await compileEditorHtml(source),
    },
  });
};
