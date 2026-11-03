import { APIError } from "better-call";
import { requestToResourceInput, verifyAccessTokenRequest } from "better-auth/oauth2";

const ISSUER = "https://you-find.me/api/auth";
const RESOURCE = "https://memos.you-find.me";

export const RESOURCE_SERVER = {
  issuer: ISSUER,
  audience: RESOURCE,
  jwksUrl: `${ISSUER}/jwks`,
  requiredScopes: ["memos:write"],
};

export const PROTECTED_RESOURCE_METADATA = {
  resource: RESOURCE,
  authorization_servers: [ISSUER],
  scopes_supported: ["memos:read", "memos:write"],
  bearer_methods_supported: ["header"],
  resource_name: "my memos",
};

export async function isOwnerRequest(request: Request, user: App.Locals["user"]): Promise<boolean> {
  if (!request.headers.has("authorization")) return user !== null;
  try {
    await verifyAccessTokenRequest(requestToResourceInput(request), {
      verifyOptions: { issuer: RESOURCE_SERVER.issuer, audience: RESOURCE_SERVER.audience },
      requiredScopes: RESOURCE_SERVER.requiredScopes,
      jwksUrl: RESOURCE_SERVER.jwksUrl,
    });
    return true;
  } catch (error) {
    if (error instanceof APIError) return false;
    throw error;
  }
}
