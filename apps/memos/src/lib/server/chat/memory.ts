import { invalidateMarkdown } from "./prompt-cache";

const MEMORY_KEY = "agent/MEMORY.md";

interface MemoryBucket {
  get(key: string): Promise<{ etag: string; text(): Promise<string> } | null>;
  put(
    key: string,
    value: string,
    options: {
      httpMetadata: { contentType: string };
      onlyIf: { etagMatches: string };
    },
  ): Promise<object | null>;
}

export async function updateMemory(
  bucket: MemoryBucket,
  { oldText, newText }: { oldText: string; newText: string },
) {
  const object = await bucket.get(MEMORY_KEY);
  if (!object) throw new Error("Memory file does not exist.");
  const current = await object.text();
  let next: string;

  if (!oldText) {
    const addition = newText.trim();
    if (!addition) throw new Error("Memory append cannot be empty.");
    if (current.includes(addition)) return { updated: false };
    next = current.trimEnd() ? `${current.trimEnd()}\n\n${addition}\n` : `${addition}\n`;
  } else {
    const index = current.indexOf(oldText);
    if (index === -1) throw new Error("Memory text to replace was not found.");
    if (current.indexOf(oldText, index + oldText.length) !== -1) {
      throw new Error("Memory text to replace is not unique.");
    }
    next = `${current.slice(0, index)}${newText}${current.slice(index + oldText.length)}`;
  }

  if (next === current) return { updated: false };
  const written = await bucket.put(MEMORY_KEY, next, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
    onlyIf: { etagMatches: object.etag },
  });
  if (!written) throw new Error("Memory changed concurrently; retry with the latest memory.");
  invalidateMarkdown(MEMORY_KEY);
  return { updated: true };
}
