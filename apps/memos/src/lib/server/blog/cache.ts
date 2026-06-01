import type { KVNamespace } from "@cloudflare/workers-types";
import type { TocEntry } from "$lib/types";
import { compileMarkdown, type CompiledNote } from "./compiler";

const KV_PREFIX = "blog-note:";
const CATEGORIES_KEY = "blog-categories";
const CATEGORIES_TTL = 300; // 5 minutes

interface CachedNote {
  title: string;
  html: string;
  toc: TocEntry[];
  excerpt: string;
  source: string;
  uploadedAt: string;
  compiledAt: number;
}

export async function readNoteKv(
  kv: KVNamespace,
  slug: string,
  uploadedAt: string,
): Promise<CachedNote | null> {
  const raw = await kv.get(`${KV_PREFIX}${slug}`, "json");
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (
    typeof data.title !== "string" ||
    typeof data.html !== "string" ||
    !Array.isArray(data.toc) ||
    typeof data.excerpt !== "string" ||
    typeof data.source !== "string" ||
    data.uploadedAt !== uploadedAt
  ) {
    return null;
  }

  return {
    title: data.title,
    html: data.html,
    toc: data.toc as TocEntry[],
    excerpt: data.excerpt,
    source: data.source,
    uploadedAt,
    compiledAt: typeof data.compiledAt === "number" ? data.compiledAt : 0,
  };
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

export async function readCategoriesKv(kv: KVNamespace): Promise<string[]> {
  const raw = await kv.get(CATEGORIES_KEY, "json");
  if (Array.isArray(raw) && raw.every((v) => typeof v === "string")) return raw;
  return [];
}

export async function writeCategoriesKv(kv: KVNamespace, categories: string[]): Promise<void> {
  await kv.put(CATEGORIES_KEY, JSON.stringify(categories), { expirationTtl: CATEGORIES_TTL });
}

export async function deleteCategoriesKv(kv: KVNamespace): Promise<void> {
  await kv.delete(CATEGORIES_KEY);
}
