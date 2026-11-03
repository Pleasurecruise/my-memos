import { requestToResourceInput, verifyAccessTokenRequest } from "better-auth/oauth2";

const ISSUER = "https://you-find.me/api/auth";
const AUDIENCE = "https://memos.you-find.me";

export async function verifyOwnerToken(request: Request): Promise<boolean> {
  await verifyAccessTokenRequest(requestToResourceInput(request), {
    verifyOptions: { issuer: ISSUER, audience: AUDIENCE },
    requiredScopes: ["memos:write"],
    jwksUrl: `${ISSUER}/jwks`,
  });
  return true;
}
