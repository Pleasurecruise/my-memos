import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { Memo } from "$lib/types";

const { apiUpdateMemo, invalidateAll } = vi.hoisted(() => ({
  apiUpdateMemo: vi.fn(),
  invalidateAll: vi.fn(),
}));

vi.mock("$app/navigation", () => ({ invalidateAll }));
vi.mock("$lib/services/memos", async (importOriginal) => {
  const original = await importOriginal<typeof import("$lib/services/memos")>();
  return { ...original, apiUpdateMemo };
});
vi.mock("$lib/state/toast.svelte", () => ({ showToast: vi.fn() }));

import { createEditActions } from "$lib/state/memo-actions.svelte";

const firstMemo = {
  id: "first",
  content: "Original",
  tags: [],
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
  visibility: "private",
  pinned: false,
  favorite: false,
  archived: false,
} satisfies Memo;

const secondMemo = { ...firstMemo, id: "second", content: "Second" } satisfies Memo;

describe("memo edit actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("saves the current draft before opening another memo", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json(firstMemo))
      .mockResolvedValueOnce(Response.json(secondMemo));
    apiUpdateMemo.mockResolvedValue(undefined);

    const edit = createEditActions();
    await edit.start(firstMemo);
    edit.editContent = "Changed";
    await edit.start(secondMemo);

    expect(apiUpdateMemo).toHaveBeenCalledWith("first", {
      content: "Changed",
      visibility: "private",
    });
    expect(invalidateAll).toHaveBeenCalledOnce();
    expect(edit.editingId).toBe("second");
    expect(edit.editContent).toBe("Second");
  });

  it("keeps the current draft when autosave fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json(firstMemo));
    apiUpdateMemo.mockRejectedValue(new Error("offline"));

    const edit = createEditActions();
    await edit.start(firstMemo);
    edit.editContent = "Changed";
    await edit.start(secondMemo);

    expect(fetch).toHaveBeenCalledOnce();
    expect(edit.editingId).toBe("first");
    expect(edit.editContent).toBe("Changed");
  });
});
