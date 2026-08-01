import { z } from "zod";
import { compileMarkdown, type CompiledNote } from "./compiler";

const KV_PREFIX = "blog-note:";
const CATEGORIES_KEY = "blog-categories";
const CATEGORIES_TTL = 300; // 5 minutes

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

type CachedNote = z.infer<typeof cachedNoteSchema>;

export async function readNoteKv(
  kv: KVNamespace,
  slug: string,
  uploadedAt: string,
): Promise<CachedNote | null> {
  const raw = await kv.get(`${KV_PREFIX}${slug}`, "json");
  const result = cachedNoteSchema.safeParse(raw);
  if (!result.success || result.data.uploadedAt !== uploadedAt) return null;
  return result.data;
}

export async function writeNoteKv(
  kv: KVNamespace,
  slug: string,
  uploadedAt: string,
  title: string,
  compiled: CompiledNote,
  source: string,
): Promise<void> {
  const data: CachedNote = {
    title,
    html: compiled.html,
    toc: compiled.toc,
    visualBlocks: compiled.visualBlocks,
    excerpt: compiled.excerpt,
    source,
    uploadedAt,
    compiledAt: Date.now(),
  };
  await kv.put(`${KV_PREFIX}${slug}`, JSON.stringify(data));
}

export async function deleteNoteKv(kv: KVNamespace, slug: string): Promise<void> {
  await kv.delete(`${KV_PREFIX}${slug}`);
}

const inflightCompilations = new Map<string, Promise<CompiledNote>>();

export async function compileNote(
  source: string,
  kv: KVNamespace,
  slug: string,
  uploadedAt: string,
  title: string,
): Promise<CompiledNote> {
  const existing = inflightCompilations.get(slug);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const compiled = await compileMarkdown(source);
      await writeNoteKv(kv, slug, uploadedAt, title, compiled, source);
      return compiled;
    } finally {
      inflightCompilations.delete(slug);
    }
  })();

  inflightCompilations.set(slug, promise);
  return promise;
}

export async function readCategoriesKv(kv: KVNamespace): Promise<string[] | null> {
  const raw = await kv.get(CATEGORIES_KEY, "json");
  const result = categoriesSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export async function writeCategoriesKv(kv: KVNamespace, categories: string[]): Promise<void> {
  await kv.put(CATEGORIES_KEY, JSON.stringify(categories), { expirationTtl: CATEGORIES_TTL });
}

export async function deleteCategoriesKv(kv: KVNamespace): Promise<void> {
  await kv.delete(CATEGORIES_KEY);
}
