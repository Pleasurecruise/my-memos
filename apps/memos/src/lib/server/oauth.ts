import { requestToResourceInput, verifyAccessTokenRequest } from "better-auth/oauth2";
import { z } from "zod";

const ISSUER = "https://you-find.me/api/auth";
const AUDIENCE = "https://memos.you-find.me";

const claimsSchema = z.object({ email: z.string() });

export async function verifyOwnerToken(request: Request, owner: string): Promise<boolean> {
  const payload = await verifyAccessTokenRequest(requestToResourceInput(request), {
    verifyOptions: { issuer: ISSUER, audience: AUDIENCE },
    requiredScopes: ["memos:write"],
    jwksUrl: `${ISSUER}/jwks`,
  });
  return claimsSchema.parse(payload).email.toLowerCase() === owner.toLowerCase();
}
