import { deleteMemoOgImagesKv } from "$lib/server/og/cache";
import type { TagCount } from "$lib/types";

function tagCacheKey(publicOnly: boolean): string {
  return publicOnly ? "memo:tags:public" : "memo:tags";
}

export async function readTagCountCache(
  cache: KVNamespace,
  publicOnly: boolean,
): Promise<TagCount[] | null> {
  return cache.get(tagCacheKey(publicOnly), "json");
}

export async function writeTagCountCache(
  cache: KVNamespace,
  publicOnly: boolean,
  tagCounts: TagCount[],
): Promise<void> {
  await cache.put(tagCacheKey(publicOnly), JSON.stringify(tagCounts));
}

export async function invalidateMemoTagCache(cache: KVNamespace): Promise<void> {
  await Promise.all([cache.delete(tagCacheKey(false)), cache.delete(tagCacheKey(true))]);
}

export async function invalidateMemoOgCache(cache: KVNamespace, id: string): Promise<void> {
  await deleteMemoOgImagesKv(cache, id);
}
