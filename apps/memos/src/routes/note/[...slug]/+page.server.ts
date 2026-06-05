import { error, redirect } from "@sveltejs/kit";
import type { KVNamespace, R2Bucket, R2ListOptions } from "@cloudflare/workers-types";
import {
  BLOG_PREFIX,
  DEFAULT_NOTE_CATEGORY,
  compileEditorHtml,
  compileNote,
  type CompiledNote,
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

interface NotePageDataInput {
  compiled: CompiledNote;
  source: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  categories: string[];
}

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

async function buildNotePageData(input: NotePageDataInput) {
  return {
    html: input.compiled.html,
    toc: input.compiled.toc,
    visualBlocks: input.compiled.visualBlocks,
    excerpt: input.compiled.excerpt,
    title: input.title,
    slug: input.slug,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    source: input.source,
    editorHtml: await compileEditorHtml(input.source),
    categories: input.categories,
    defaultCategory: DEFAULT_NOTE_CATEGORY,
  };
}

export const load: PageServerLoad = async ({ params, platform, locals }) => {
  if (!locals.user) {
    redirect(302, "/");
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
    const createdAt = new Date().toISOString();
    return buildNotePageData({
      compiled: { html: "", toc: [], visualBlocks: [], excerpt: "" },
      source: "",
      title: "",
      slug,
      createdAt,
      updatedAt: createdAt,
      categories,
    });
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
      return buildNotePageData({ compiled, source, title, slug, createdAt, updatedAt, categories });
    }

    return buildNotePageData({
      compiled: cached,
      source,
      title,
      slug,
      createdAt,
      updatedAt,
      categories,
    });
  }

  const rawSource = await object.text();
  const source = stripLeadingTitleHeading(rawSource);
  const title = object.customMetadata?.title ?? slugToTitle(slug);
  const compiled = await compileNote(source, kv, slug, uploadedAt, title);

  return buildNotePageData({ compiled, source, title, slug, createdAt, updatedAt, categories });
};
