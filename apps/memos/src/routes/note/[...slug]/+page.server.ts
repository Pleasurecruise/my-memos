import { error, redirect } from "@sveltejs/kit";
import {
  compileEditorHtml,
  compileNote,
  extractTitle,
  r2KeyFromSlug,
  readNoteKv,
  slugToTitle,
} from "$lib/server/blog";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, platform, locals, url }) => {
  if (!locals.user) {
    redirect(302, `/login?redirect=${url.pathname}`);
  }
  if (!platform) {
    error(500, "Cloudflare platform bindings are unavailable.");
  }

  const rawSlug = params.slug;

  if (!rawSlug) {
    error(404, "Note not found.");
  }

  const slug = rawSlug.replace(/\.md$/i, "");
  const r2Key = r2KeyFromSlug(slug);

  const bucket = platform.env.MEMOS_BUCKET;
  const kv = platform.env.MEMOS_CACHE;

  const object = await bucket.get(r2Key);
  if (!object) {
    error(404, `Note "${slug}" not found.`);
  }

  const uploadedAt = object.uploaded.toISOString();
  const createdAt = object.customMetadata?.createdAt ?? uploadedAt;
  const updatedAt = object.customMetadata?.updatedAt ?? uploadedAt;

  const cached = await readNoteKv(kv, slug, uploadedAt);
  if (cached) {
    return {
      html: cached.html,
      toc: cached.toc,
      excerpt: cached.excerpt,
      title: cached.title,
      slug,
      createdAt,
      updatedAt,
      source: cached.source,
      editorHtml: await compileEditorHtml(cached.source),
    };
  }

  const source = await object.text();
  const titleFromContent = extractTitle(source);
  const title = titleFromContent || slugToTitle(slug);
  const compiled = await compileNote(source, kv, slug, uploadedAt, title);

  return {
    html: compiled.html,
    toc: compiled.toc,
    excerpt: compiled.excerpt,
    title,
    slug,
    createdAt,
    updatedAt,
    source,
    editorHtml: await compileEditorHtml(source),
  };
};
