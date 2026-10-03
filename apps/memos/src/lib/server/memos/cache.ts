import { deleteMemoOgImagesKv } from "#lib/server/og/cache.ts";

export async function invalidateMemoOgCache(cache: KVNamespace, id: string): Promise<void> {
  await deleteMemoOgImagesKv(cache, id);
}
