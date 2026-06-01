import { error, redirect } from "@sveltejs/kit";
import type { KVNamespace, R2Bucket, R2ListOptions } from "@cloudflare/workers-types";
import {
  BLOG_PREFIX,
  DEFAULT_NOTE_CATEGORY,
  compileEditorHtml,
  compileNote,
  r2KeyFromSlug,
  readCategoriesKv,
  readNoteKv,
  slugFromR2Key,
  slugToTitle,
  stripLeadingTitleHeading,
  writeCategoriesKv,
} from "$lib/server/blog";
import { categoryFromSlug } from "$lib/utils/url";
import type { PageServerLoad } from "./$types";

async function getCategories(bucket: R2Bucket, kv: KVNamespace): Promise<string[]> {
  const cached = await readCategoriesKv(kv);
  if (cached.length > 0) return cached;

  const categories = new Set<string>();
  let cursor: string | undefined;

  do {
    const listOpts: R2ListOptions = {
      prefix: BLOG_PREFIX,
      limit: 1000,
      cursor,
    };
    const listingResponse = await bucket.list(listOpts);

    for (const r2Object of listingResponse.objects) {
      if (r2Object.key.endsWith("/") || !r2Object.key.toLowerCase().endsWith(".md")) continue;
      const category = categoryFromSlug(slugFromR2Key(r2Object.key));
      if (category) categories.add(category);
    }

    cursor = listingResponse.truncated ? listingResponse.cursor : undefined;
  } while (cursor);

  const result = [...categories].sort((a, b) => a.localeCompare(b));
  await writeCategoriesKv(kv, result);
  return result;
}

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
  const categories = await getCategories(bucket, kv);

  if (slug === "new") {
    const source = "";
    return {
      html: "",
      toc: [],
      excerpt: "",
      title: "",
      slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source,
      editorHtml: await compileEditorHtml(source),
      categories,
      defaultCategory: DEFAULT_NOTE_CATEGORY,
    };
  }

  const object = await bucket.get(r2Key);
  if (!object) {
    error(404, `Note "${slug}" not found.`);
  }

  const uploadedAt = object.uploaded.toISOString();
  const createdAt = object.customMetadata?.createdAt ?? uploadedAt;
  const updatedAt = object.customMetadata?.updatedAt ?? uploadedAt;

  const cached = await readNoteKv(kv, slug, uploadedAt);
  if (cached) {
    const source = stripLeadingTitleHeading(cached.source);
    const title = object.customMetadata?.title ?? slugToTitle(slug);
    if (source !== cached.source) {
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
        categories,
        defaultCategory: DEFAULT_NOTE_CATEGORY,
      };
    }

    return {
      html: cached.html,
      toc: cached.toc,
      excerpt: cached.excerpt,
      title,
      slug,
      createdAt,
      updatedAt,
      source,
      editorHtml: await compileEditorHtml(source),
      categories,
      defaultCategory: DEFAULT_NOTE_CATEGORY,
    };
  }

  const rawSource = await object.text();
  const source = stripLeadingTitleHeading(rawSource);
  const title = object.customMetadata?.title ?? slugToTitle(slug);
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
    categories,
    defaultCategory: DEFAULT_NOTE_CATEGORY,
  };
};
