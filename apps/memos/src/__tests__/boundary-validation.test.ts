import { describe, expect, it, vi } from "vitest";
import { readCategoryCache } from "$lib/server/notes/cache";
import { readLimitedText } from "$lib/server/mcp/utils";
import {
  isMemoSearchWithinLimit,
  isValidMemoDate,
  MAX_MEMO_SEARCH_BYTES,
} from "$lib/server/memos/validation";

describe("memo filter validation", () => {
  it("measures search input in UTF-8 bytes", () => {
    expect(MAX_MEMO_SEARCH_BYTES).toBe(48);
    expect(isMemoSearchWithinLimit("a".repeat(48))).toBe(true);
    expect(isMemoSearchWithinLimit("a".repeat(49))).toBe(false);
    expect(isMemoSearchWithinLimit("备忘录".repeat(5) + "备")).toBe(true);
    expect(isMemoSearchWithinLimit("备忘录".repeat(5) + "备忘")).toBe(false);
  });

  it("rejects impossible calendar dates", () => {
    expect(isValidMemoDate("2024-02-29")).toBe(true);
    expect(isValidMemoDate("2025-02-29")).toBe(false);
    expect(isValidMemoDate("2025-13-01")).toBe(false);
    expect(isValidMemoDate("2025-1-01")).toBe(false);
  });
});

describe("external response limits", () => {
  it("accepts a response within the byte limit", async () => {
    await expect(readLimitedText(new Response("你好"), "test", 6)).resolves.toBe("你好");
  });

  it("rejects a streamed response beyond the byte limit", async () => {
    await expect(readLimitedText(new Response("你好"), "test", 5)).rejects.toThrow(
      "response exceeds the 5-byte limit",
    );
  });

  it("rejects an oversized declared content length before reading", async () => {
    const response = new Response("small", { headers: { "Content-Length": "100" } });
    await expect(readLimitedText(response, "test", 10)).rejects.toThrow(
      "response exceeds the 10-byte limit",
    );
  });
});

describe("KV cache boundaries", () => {
  it("preserves an intentionally empty category cache", async () => {
    const kv = { get: vi.fn().mockResolvedValue([]) } as unknown as KVNamespace;
    await expect(readCategoryCache(kv)).resolves.toEqual([]);
  });

  it("treats a malformed category cache as a miss", async () => {
    const kv = { get: vi.fn().mockResolvedValue(["valid", 42]) } as unknown as KVNamespace;
    await expect(readCategoryCache(kv)).resolves.toBeNull();
  });
});
