import { z } from "zod";
import { compileMarkdown, type CompiledNote } from "$lib/server/blog/compiler";

const KV_PREFIX = "blog-note:";
const CATEGORIES_KEY = "blog-categories";
const CATEGORIES_TTL = 300;

const cachedNoteSchema = z.object({
  title: z.string(),
  html: z.string(),
  toc: z.array(z.object({ depth: z.number(), text: z.string(), id: z.string() })),
  visualBlocks: z
    .array(
      z.object({
        type: z.enum(["svg", "mermaid", "chart", "widget"]),
        code: z.string(),
        index: z.number(),
      }),
    )
    .default([]),
  excerpt: z.string(),
  source: z.string(),
  uploadedAt: z.string(),
  compiledAt: z.number().default(0),
});

const categoriesSchema = z.array(z.string());

export type CachedNote = z.infer<typeof cachedNoteSchema>;

export async function readNoteCache(
  cache: KVNamespace,
  slug: string,
  uploadedAt: string,
): Promise<CachedNote | null> {
  const raw = await cache.get(`${KV_PREFIX}${slug}`, "json");
  const parsed = cachedNoteSchema.safeParse(raw);
  if (!parsed.success || parsed.data.uploadedAt !== uploadedAt) return null;
  return parsed.data;
}

export async function writeNoteCache(
  cache: KVNamespace,
  slug: string,
  uploadedAt: string,
  title: string,
  compiled: CompiledNote,
  source: string,
): Promise<void> {
  const cachedNote: CachedNote = {
    title,
    html: compiled.html,
    toc: compiled.toc,
    visualBlocks: compiled.visualBlocks,
    excerpt: compiled.excerpt,
    source,
    uploadedAt,
    compiledAt: Date.now(),
  };
  await cache.put(`${KV_PREFIX}${slug}`, JSON.stringify(cachedNote));
}

export async function deleteNoteCache(cache: KVNamespace, slug: string): Promise<void> {
  await cache.delete(`${KV_PREFIX}${slug}`);
}

const inflightCompilations = new Map<string, Promise<CompiledNote>>();

export async function compileNote(
  source: string,
  cache: KVNamespace,
  slug: string,
  uploadedAt: string,
  title: string,
): Promise<CompiledNote> {
  const existing = inflightCompilations.get(slug);
  if (existing) return existing;

  const compilation = (async () => {
    try {
      const compiled = await compileMarkdown(source);
      await writeNoteCache(cache, slug, uploadedAt, title, compiled, source);
      return compiled;
    } finally {
      inflightCompilations.delete(slug);
    }
  })();

  inflightCompilations.set(slug, compilation);
  return compilation;
}

export async function readCategoryCache(cache: KVNamespace): Promise<string[] | null> {
  const raw = await cache.get(CATEGORIES_KEY, "json");
  const parsed = categoriesSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function writeCategoryCache(cache: KVNamespace, categories: string[]): Promise<void> {
  await cache.put(CATEGORIES_KEY, JSON.stringify(categories), { expirationTtl: CATEGORIES_TTL });
}

export async function deleteCategoryCache(cache: KVNamespace): Promise<void> {
  await cache.delete(CATEGORIES_KEY);
}
