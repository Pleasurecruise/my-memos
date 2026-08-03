import { beforeEach, describe, expect, it, vi } from "vitest";
import { invalidateMemoOgCache, invalidateMemoTagCache } from "$lib/server/memos/cache";
import { findMemoRow, listAgentMemoRecords, updateMemoRow } from "$lib/server/memos/repository";
import { searchAgentMemos, updateMemo } from "$lib/server/memos/service";
import { readMemoBody, writeMemoBody } from "$lib/server/memos/storage";

vi.mock("$lib/server/memos/cache", () => ({
  invalidateMemoOgCache: vi.fn(),
  invalidateMemoTagCache: vi.fn(),
  readTagCountCache: vi.fn(),
  writeTagCountCache: vi.fn(),
}));

vi.mock("$lib/server/memos/repository", () => ({
  deleteMemoRow: vi.fn(),
  findMemoRow: vi.fn(),
  insertMemoRow: vi.fn(),
  listAgentMemoRecords: vi.fn(),
  memoFromRow: vi.fn((row) => ({
    id: row.id,
    content: row.excerpt,
    tags: row.tagsJson,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    visibility: row.visibility,
    pinned: row.pinned,
    archived: row.archived,
  })),
  queryTagCounts: vi.fn(),
  updateMemoRow: vi.fn(),
}));

vi.mock("$lib/server/memos/storage", () => ({
  deleteMemoBody: vi.fn(),
  readMemoBody: vi.fn(),
  writeMemoBody: vi.fn(),
}));

const memoRow = {
  id: "20260803T000000Z-12345678",
  r2Key: "memos/2026/08/memo.md",
  tagsJson: ["old"],
  excerpt: "Body\n\n#old",
  createdAt: "2026-08-03T00:00:00.000Z",
  updatedAt: "2026-08-03T00:00:00.000Z",
  visibility: "private" as const,
  pinned: false,
  archived: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findMemoRow).mockResolvedValue(memoRow);
  vi.mocked(readMemoBody).mockResolvedValue("Body\n\n#old");
  vi.mocked(updateMemoRow).mockResolvedValue({
    ...memoRow,
    excerpt: "Body\n\n#new",
    tagsJson: ["new"],
  });
});

describe("memo service", () => {
  it("keeps the R2 body and D1 mirror synchronized for tag-only updates", async () => {
    const memo = await updateMemo({} as D1Database, {} as R2Bucket, {} as KVNamespace, memoRow.id, {
      tags: ["new"],
    });

    expect(writeMemoBody).toHaveBeenCalledWith(expect.anything(), memoRow.r2Key, "Body\n\n#new");
    expect(updateMemoRow).toHaveBeenCalledWith(
      expect.anything(),
      memoRow.id,
      expect.objectContaining({ excerpt: "Body\n\n#new", tagsJson: ["new"] }),
    );
    expect(invalidateMemoOgCache).toHaveBeenCalledWith(expect.anything(), memoRow.id);
    expect(invalidateMemoTagCache).toHaveBeenCalledOnce();
    expect(memo.tags).toEqual(["new"]);
  });

  it("loads canonical R2 bodies for agent search and falls back to the D1 mirror", async () => {
    vi.mocked(listAgentMemoRecords).mockResolvedValue([
      {
        id: "one",
        r2Key: "one.md",
        excerpt: "mirror one",
        tags: ["one"],
        createdAt: "2026-08-03T00:00:00.000Z",
      },
      {
        id: "two",
        r2Key: "two.md",
        excerpt: "mirror two",
        tags: ["two"],
        createdAt: "2026-08-02T00:00:00.000Z",
      },
    ]);
    vi.mocked(readMemoBody).mockResolvedValueOnce("canonical one").mockResolvedValueOnce(null);

    const memos = await searchAgentMemos({} as D1Database, {} as R2Bucket, {
      query: "memo",
      limit: 10,
    });

    expect(memos.map((memo) => memo.content)).toEqual(["canonical one", "mirror two"]);
  });
});
