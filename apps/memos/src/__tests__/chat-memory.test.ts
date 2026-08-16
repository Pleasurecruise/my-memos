import { beforeEach, describe, expect, it, vi } from "vitest";

const promptCache = vi.hoisted(() => ({ invalidateMarkdown: vi.fn() }));
vi.mock("$lib/server/chat/prompt-cache", () => promptCache);

import { updateMemory } from "$lib/server/chat/memory";

const MEMORY = "# Memory\n\n- Likes tea\n";
const WRITE_OPTIONS = {
  httpMetadata: { contentType: "text/markdown; charset=utf-8" },
  onlyIf: { etagMatches: "etag-1" },
};

function fakeBucket(value: string) {
  const get = vi.fn().mockResolvedValue({
    etag: "etag-1",
    text: vi.fn().mockResolvedValue(value),
  });
  const put = vi.fn().mockResolvedValue({ etag: "etag-2" });
  return { bucket: { get, put }, get, put };
}

describe("tool-driven memory updates", () => {
  beforeEach(() => vi.clearAllMocks());

  it("appends to the existing memory file and invalidates its cache", async () => {
    const fixture = fakeBucket(MEMORY);

    await expect(
      updateMemory(fixture.bucket, { oldText: "", newText: "- Prefers flat white" }),
    ).resolves.toEqual({ updated: true });

    expect(fixture.get).toHaveBeenCalledWith("agent/MEMORY.md");
    expect(fixture.put).toHaveBeenCalledWith(
      "agent/MEMORY.md",
      "# Memory\n\n- Likes tea\n\n- Prefers flat white\n",
      WRITE_OPTIONS,
    );
    expect(promptCache.invalidateMarkdown).toHaveBeenCalledWith("agent/MEMORY.md");
  });

  it("replaces one exact memory fragment", async () => {
    const fixture = fakeBucket(MEMORY);

    await expect(
      updateMemory(fixture.bucket, { oldText: "Likes tea", newText: "Likes coffee" }),
    ).resolves.toEqual({ updated: true });
    expect(fixture.put).toHaveBeenCalledWith(
      "agent/MEMORY.md",
      "# Memory\n\n- Likes coffee\n",
      WRITE_OPTIONS,
    );
  });

  it("removes one exact memory fragment", async () => {
    const fixture = fakeBucket(MEMORY);

    await expect(
      updateMemory(fixture.bucket, { oldText: "- Likes tea\n", newText: "" }),
    ).resolves.toEqual({ updated: true });
    expect(fixture.put).toHaveBeenCalledWith("agent/MEMORY.md", "# Memory\n\n", WRITE_OPTIONS);
  });

  it("does not write or invalidate cache when the edit changes nothing", async () => {
    const duplicate = fakeBucket(MEMORY);
    await expect(
      updateMemory(duplicate.bucket, { oldText: "", newText: "- Likes tea" }),
    ).resolves.toEqual({ updated: false });

    const sameReplacement = fakeBucket(MEMORY);
    await expect(
      updateMemory(sameReplacement.bucket, { oldText: "Likes tea", newText: "Likes tea" }),
    ).resolves.toEqual({ updated: false });

    expect(duplicate.put).not.toHaveBeenCalled();
    expect(sameReplacement.put).not.toHaveBeenCalled();
    expect(promptCache.invalidateMarkdown).not.toHaveBeenCalled();
  });

  it("rejects an empty append", async () => {
    const fixture = fakeBucket(MEMORY);

    await expect(updateMemory(fixture.bucket, { oldText: "", newText: "  " })).rejects.toThrow(
      "cannot be empty",
    );
    expect(fixture.put).not.toHaveBeenCalled();
  });

  it("rejects a replacement target that is missing or ambiguous", async () => {
    const missing = fakeBucket(MEMORY);
    await expect(
      updateMemory(missing.bucket, { oldText: "Likes cats", newText: "Likes dogs" }),
    ).rejects.toThrow("not found");

    const ambiguous = fakeBucket("tea tea");
    await expect(
      updateMemory(ambiguous.bucket, { oldText: "tea", newText: "coffee" }),
    ).rejects.toThrow("not unique");

    expect(missing.put).not.toHaveBeenCalled();
    expect(ambiguous.put).not.toHaveBeenCalled();
  });

  it("rejects a missing memory file instead of creating one", async () => {
    const get = vi.fn().mockResolvedValue(null);
    const put = vi.fn();

    await expect(
      updateMemory({ get, put }, { oldText: "", newText: "- Likes coffee" }),
    ).rejects.toThrow("does not exist");
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a concurrent write without invalidating cache", async () => {
    const fixture = fakeBucket(MEMORY);
    fixture.put.mockResolvedValueOnce(null);

    await expect(
      updateMemory(fixture.bucket, { oldText: "Likes tea", newText: "Likes coffee" }),
    ).rejects.toThrow("concurrently");
    expect(promptCache.invalidateMarkdown).not.toHaveBeenCalled();
  });
});
