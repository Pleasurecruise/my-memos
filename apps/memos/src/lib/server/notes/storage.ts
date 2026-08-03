import { BLOG_PREFIX, r2KeyFromSlug, slugFromR2Key } from "$lib/server/blog/constants";
import { slugToTitle } from "$lib/server/blog/title";

export interface StoredNoteMetadata {
  slug: string;
  size: number;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
  title: string;
}

export interface StoredNote extends StoredNoteMetadata {
  source: string;
  customMetadata?: Record<string, string>;
}

export interface WriteStoredNoteInput {
  source: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  customMetadata?: Record<string, string>;
}

function metadataFromObject(object: R2Object): StoredNoteMetadata {
  const slug = slugFromR2Key(object.key);
  const uploadedAt = object.uploaded.toISOString();

  return {
    slug,
    size: object.size,
    uploadedAt,
    createdAt: object.customMetadata?.createdAt ?? uploadedAt,
    updatedAt: object.customMetadata?.updatedAt ?? uploadedAt,
    title: object.customMetadata?.title ?? slugToTitle(slug),
  };
}

export async function listStoredNotes(bucket: R2Bucket): Promise<StoredNoteMetadata[]> {
  const notes: StoredNoteMetadata[] = [];
  let cursor: string | undefined;

  do {
    const options: R2ListOptions & { include: string[] } = {
      prefix: BLOG_PREFIX,
      limit: 1000,
      cursor,
      include: ["customMetadata"],
    };
    const response = await bucket.list(options);

    for (const object of response.objects) {
      if (object.key.endsWith("/") || !object.key.toLowerCase().endsWith(".md")) continue;
      notes.push(metadataFromObject(object));
    }

    cursor = response.truncated ? response.cursor : undefined;
  } while (cursor);

  return notes;
}

export async function headStoredNote(bucket: R2Bucket, slug: string): Promise<R2Object | null> {
  return bucket.head(r2KeyFromSlug(slug));
}

export async function readStoredNote(bucket: R2Bucket, slug: string): Promise<StoredNote | null> {
  const object = await bucket.get(r2KeyFromSlug(slug));
  if (!object) return null;

  return {
    ...metadataFromObject(object),
    source: await object.text(),
    customMetadata: object.customMetadata,
  };
}

export async function writeStoredNote(
  bucket: R2Bucket,
  slug: string,
  input: WriteStoredNoteInput,
): Promise<StoredNoteMetadata | null> {
  const object = await bucket.put(r2KeyFromSlug(slug), input.source, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
    customMetadata: {
      ...input.customMetadata,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      title: input.title,
    },
  });

  return object ? metadataFromObject(object) : null;
}

export async function deleteStoredNote(bucket: R2Bucket, slug: string): Promise<void> {
  await bucket.delete(r2KeyFromSlug(slug));
}
