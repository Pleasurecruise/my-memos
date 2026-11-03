import { describe, expect, it } from "vite-plus/test";
import { isOwnerRequest } from "#lib/server/oauth.ts";

describe("isOwnerRequest", () => {
  const user = {
    id: "owner-id",
    email: "owner@example.test",
    emailVerified: true,
    name: "Owner",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("trusts the signed-in session when no bearer token is sent", async () => {
    const request = new Request("https://example.test/api/memos");
    await expect(isOwnerRequest(request, user)).resolves.toBe(true);
    await expect(isOwnerRequest(request, null)).resolves.toBe(false);
  });

  it("judges a request that sends Authorization only by the access token", async () => {
    const request = new Request("https://example.test/api/memos", {
      headers: { authorization: "Bearer not-a-jwt" },
    });
    await expect(isOwnerRequest(request, user)).resolves.toBe(false);
  });
});
