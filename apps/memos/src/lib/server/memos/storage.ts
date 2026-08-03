export async function readMemoBody(bucket: R2Bucket, key: string): Promise<string | null> {
  const object = await bucket.get(key);
  return object ? object.text() : null;
}

export async function writeMemoBody(bucket: R2Bucket, key: string, content: string): Promise<void> {
  await bucket.put(key, content, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
  });
}

export async function deleteMemoBody(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}
