import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

const ai = vi.hoisted(() => ({
  createOpenAICompatibleModel: vi.fn(() => ({ id: "test-model" })),
  runAgent: vi.fn(),
}));

vi.mock("@my-memos/ai-core", () => ai);

import { updateMemoryAfterChat } from "$lib/server/chat/memory";
import type { AppEnv } from "$lib/server/types";

function modelResult(value: { changed: boolean; memory: string }) {
  return [
    {
      role: "assistant",
      content: [{ type: "text", text: JSON.stringify(value) }],
    },
  ];
}

function storedMemory(value: string, etag: string) {
  return { etag, text: vi.fn().mockResolvedValue(value) } as unknown as R2ObjectBody;
}

function fakeEnv({
  get = vi.fn().mockResolvedValue(storedMemory("# Memory", "etag-1")),
  put = vi.fn().mockResolvedValue({ etag: "etag-2" }),
  dedupe = vi.fn().mockResolvedValue(null),
}: {
  get?: Mock;
  put?: Mock;
  dedupe?: Mock;
} = {}) {
  const cachePut = vi.fn().mockResolvedValue(undefined);
  const env = {
    CF_ACCOUNT_ID: "account",
    CF_AIG_TOKEN: "gateway-token",
    MEMOS_BUCKET: { get, put },
    MEMOS_CACHE: { get: dedupe, put: cachePut },
  } as unknown as AppEnv;
  return { env, get, put, dedupe, cachePut };
}

describe("background memory update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deduplicates a completed user message without retaining its content", async () => {
    const fixture = fakeEnv({ dedupe: vi.fn().mockResolvedValue("updated") });

    await updateMemoryAfterChat(fixture.env, "message-1", "private input", "reply");

    expect(ai.runAgent).not.toHaveBeenCalled();
    expect(fixture.put).not.toHaveBeenCalled();
    expect(fixture.cachePut).not.toHaveBeenCalled();
  });

  it("does not write R2 when the model reports no durable change", async () => {
    const fixture = fakeEnv();
    ai.runAgent.mockResolvedValueOnce(modelResult({ changed: false, memory: "# Memory" }));

    await updateMemoryAfterChat(fixture.env, "message-2", "hello", "hi");

    expect(fixture.put).not.toHaveBeenCalled();
    expect(fixture.cachePut).toHaveBeenNthCalledWith(
      1,
      "agent:memory-update:message-2",
      "pending",
      {
        expirationTtl: 3600,
      },
    );
    expect(fixture.cachePut).toHaveBeenNthCalledWith(
      2,
      "agent:memory-update:message-2",
      "unchanged",
      { expirationTtl: 3600 },
    );
  });

  it("writes a complete changed memory with the current ETag condition", async () => {
    const fixture = fakeEnv();
    ai.runAgent.mockResolvedValueOnce(
      modelResult({ changed: true, memory: "# Memory\n\n- Likes cats" }),
    );

    await updateMemoryAfterChat(fixture.env, "message-3", "remember I like cats", "okay");

    expect(fixture.put).toHaveBeenCalledWith("agent/MEMORY.md", "# Memory\n\n- Likes cats", {
      httpMetadata: { contentType: "text/markdown; charset=utf-8" },
      onlyIf: { etagMatches: "etag-1" },
    });
    const prompt = ai.runAgent.mock.calls[0][0].messages[0].content as string;
    expect(prompt).toContain("remember/forget instructions");
    expect(prompt).toContain("credentials, secrets, or sensitive data");
    expect(ai.runAgent.mock.calls[0][0].headers).toEqual({
      "cf-aig-authorization": "Bearer gateway-token",
      Authorization: null,
      "x-api-key": null,
    });
  });

  it("re-reads and summarizes once after an ETag conflict", async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce(storedMemory("old", "etag-1"))
      .mockResolvedValueOnce(storedMemory("newer", "etag-2"));
    const put = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ etag: "etag-3" });
    const fixture = fakeEnv({ get, put });
    ai.runAgent
      .mockResolvedValueOnce(modelResult({ changed: true, memory: "first summary" }))
      .mockResolvedValueOnce(modelResult({ changed: true, memory: "merged summary" }));

    await updateMemoryAfterChat(fixture.env, "message-4", "correction", "noted");

    expect(ai.runAgent).toHaveBeenCalledTimes(2);
    expect(put).toHaveBeenNthCalledWith(
      2,
      "agent/MEMORY.md",
      "merged summary",
      expect.objectContaining({ onlyIf: { etagMatches: "etag-2" } }),
    );
  });

  it("isolates model failures from the completed chat", async () => {
    const fixture = fakeEnv();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    ai.runAgent.mockRejectedValueOnce(new Error("upstream unavailable"));

    await expect(
      updateMemoryAfterChat(fixture.env, "message-5", "hello", "reply"),
    ).resolves.toBeUndefined();
    expect(fixture.cachePut).toHaveBeenLastCalledWith("agent:memory-update:message-5", "failed", {
      expirationTtl: 300,
    });
    error.mockRestore();
  });
});
