import { z } from "zod";

const API_KEY_INSTANCE = "my-memos-api-key";
const API_KEY_URL = "https://api-key.internal/key";

const apiKeyRecordSchema = z.object({
  version: z.literal(1),
  digest: z.string().regex(/^[0-9a-f]{64}$/),
  createdAt: z.string().datetime(),
});

export interface ApiKeyNamespace {
  getByName(name: string): { fetch(request: Request): Promise<Response> };
}

export async function getApiKeyStatus(namespace: ApiKeyNamespace) {
  const response = await namespace.getByName(API_KEY_INSTANCE).fetch(new Request(API_KEY_URL));
  if (response.status === 404) return { configured: false as const };
  if (!response.ok) throw new Error(`API key read failed with status ${response.status}.`);
  const apiKeyRecord = apiKeyRecordSchema.parse(await response.json());
  return { configured: true as const, createdAt: apiKeyRecord.createdAt };
}

export async function generateApiKey(namespace: ApiKeyNamespace) {
  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  const encoded = btoa(String.fromCharCode(...random))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const apiKey = `sk-${encoded}`;
  const apiKeyRecord = {
    version: 1 as const,
    digest: Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(apiKey))),
      (byte) => byte.toString(16).padStart(2, "0"),
    ).join(""),
    createdAt: new Date().toISOString(),
  };

  const response = await namespace.getByName(API_KEY_INSTANCE).fetch(
    new Request(API_KEY_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiKeyRecord),
    }),
  );
  if (!response.ok) throw new Error(`API key write failed with status ${response.status}.`);
  return { apiKey, createdAt: apiKeyRecord.createdAt };
}

export async function verifyApiKey(request: Request, namespace: ApiKeyNamespace): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  if (authorization === null) return false;
  if (!authorization.startsWith("Bearer ")) return false;

  const supplied = authorization.slice(7);
  if (!supplied) return false;
  const response = await namespace.getByName(API_KEY_INSTANCE).fetch(new Request(API_KEY_URL));
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`API key read failed with status ${response.status}.`);
  const apiKeyRecord = apiKeyRecordSchema.parse(await response.json());
  const expectedDigest = apiKeyRecord.digest;

  const suppliedDigest = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(supplied))),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
  let difference = 0;
  for (let index = 0; index < suppliedDigest.length; index += 1) {
    difference |= suppliedDigest.charCodeAt(index) ^ expectedDigest.charCodeAt(index);
  }
  return difference === 0;
}

export async function isOwnerRequest(
  request: Request,
  user: App.Locals["user"],
  namespace: ApiKeyNamespace,
): Promise<boolean> {
  if (request.headers.has("authorization")) return verifyApiKey(request, namespace);
  return user !== null;
}
