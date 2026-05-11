export function createMemoId(now = new Date()): string {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const random = crypto.randomUUID().slice(0, 8);
  return `${stamp}-${random}`;
}

export function buildMemoR2Key(id: string, createdAt: Date): string {
  const year = String(createdAt.getUTCFullYear());
  const month = String(createdAt.getUTCMonth() + 1).padStart(2, "0");
  return `memos/${year}/${month}/${id}.md`;
}

export function normalizeTags(content: string): string[] {
  const matches = content.match(/(^|\s)#([\p{Letter}\p{Number}_/-]+)/gu) ?? [];
  const tags = matches.map((m) => m.trim().slice(1).toLowerCase());
  return [...new Set(tags)].slice(0, 24);
}
