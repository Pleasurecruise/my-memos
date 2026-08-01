import type { CachedMarkdown } from "./types";

const CACHE_TTL_MS = 30_000;

const cache = new Map<string, CachedMarkdown>();

async function loadMarkdown(bucket: R2Bucket, key: string): Promise<CachedMarkdown> {
  const now = Date.now();
  const current = cache.get(key);
  if (current && current.expiresAt > now) return current;

  if (current) {
    const head = await bucket.head(key);
    if (head?.etag === current.etag) {
      const refreshed = { ...current, expiresAt: now + CACHE_TTL_MS };
      cache.set(key, refreshed);
      return refreshed;
    }
  }

  const object = await bucket.get(key);
  const loaded = {
    value: object ? await object.text() : "",
    etag: object?.etag ?? null,
    expiresAt: now + CACHE_TTL_MS,
  };
  cache.set(key, loaded);
  return loaded;
}

export async function loadPromptMemory(bucket: R2Bucket) {
  const [prompt, memory] = await Promise.all([
    loadMarkdown(bucket, "agent/PROMPT.md"),
    loadMarkdown(bucket, "agent/MEMORY.md"),
  ]);
  return { prompt: prompt.value, memory: memory.value };
}

export function invalidateMarkdown(key: string) {
  cache.delete(key);
}
