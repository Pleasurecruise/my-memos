import type { KVNamespace } from "@cloudflare/workers-types";

const KV_PREFIX = "memo-og:";
const PNG_TTL = 60 * 60 * 24 * 30;

export interface OgCacheKey {
  id: string;
  updatedAt: string;
  format: "png";
}

export async function readOgImageKv(
  kv: KVNamespace,
  cacheKey: OgCacheKey,
): Promise<ArrayBuffer | null> {
  const cacheKeyValue = `${KV_PREFIX}${cacheKey.id}:${cacheKey.updatedAt}:${cacheKey.format}`;
  return kv.get(cacheKeyValue, "arrayBuffer");
}

export async function writeOgImageKv(
  kv: KVNamespace,
  cacheKey: OgCacheKey,
  image: ArrayBuffer,
): Promise<void> {
  const cacheKeyValue = `${KV_PREFIX}${cacheKey.id}:${cacheKey.updatedAt}:${cacheKey.format}`;
  await kv.put(cacheKeyValue, image, { expirationTtl: PNG_TTL });
}

export async function deleteOgImageKv(kv: KVNamespace, cacheKey: OgCacheKey): Promise<void> {
  const cacheKeyValue = `${KV_PREFIX}${cacheKey.id}:${cacheKey.updatedAt}:${cacheKey.format}`;
  await kv.delete(cacheKeyValue);
}

export async function deleteMemoOgImagesKv(kv: KVNamespace, id: string): Promise<void> {
  let cursor: string | undefined;

  do {
    const page = await kv.list({ prefix: `${KV_PREFIX}${id}:`, cursor });
    await Promise.all(page.keys.map((item) => kv.delete(item.name)));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
}
