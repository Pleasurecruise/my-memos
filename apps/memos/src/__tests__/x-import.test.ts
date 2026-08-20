import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { apiImportXPost } from "$lib/services/memos";
import { parseXPostId, xPostResponseSchema } from "$lib/server/x-import";

describe("X post import", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("accepts X and Twitter status URLs", () => {
    expect(parseXPostId("https://x.com/Cloudflare/status/2084626665670398004")).toBe(
      "2084626665670398004",
    );
    expect(parseXPostId("https://www.twitter.com/user/status/12345?ref=home")).toBe("12345");
  });

  it("rejects non-status and untrusted URLs", () => {
    expect(parseXPostId("https://x.com/Cloudflare")).toBeNull();
    expect(parseXPostId("https://example.com/user/status/12345")).toBeNull();
    expect(parseXPostId("not a URL")).toBeNull();
  });

  it("validates the external fields used to create a memo", () => {
    expect(
      xPostResponseSchema.safeParse({
        tweet: {
          text: "A useful post",
          url: "https://x.com/Cloudflare/status/2084626665670398004",
          author: { name: "Cloudflare", screen_name: "Cloudflare" },
        },
      }).success,
    ).toBe(true);
    expect(xPostResponseSchema.safeParse({ tweet: { text: "A useful post" } }).success).toBe(false);
  });

  it("returns the API error without throwing away its message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ error: "X post not found." }, { status: 404 }),
    );

    await expect(
      apiImportXPost("https://x.com/Cloudflare/status/2084626665670398004", "private"),
    ).resolves.toEqual({ success: false, error: "X post not found." });
  });

  it("reports a successful import", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ memo: {} }, { status: 201 }));

    await expect(
      apiImportXPost("https://x.com/Cloudflare/status/2084626665670398004", "public"),
    ).resolves.toEqual({ success: true });
  });
});
