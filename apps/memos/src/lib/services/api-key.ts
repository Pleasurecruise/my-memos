import { z } from "zod";

const statusSchema = z.discriminatedUnion("configured", [
  z.object({ configured: z.literal(false) }),
  z.object({ configured: z.literal(true), createdAt: z.string() }),
]);

const generatedSchema = z.object({ apiKey: z.string().min(1), createdAt: z.string() });
const errorSchema = z.object({ error: z.string().min(1) });

export async function apiGetApiKeyStatus() {
  const response = await fetch("/api/settings/api-key");
  if (!response.ok) throw new Error(errorSchema.parse(await response.json()).error);
  return statusSchema.parse(await response.json());
}

export async function apiGenerateApiKey(method: "POST" | "PUT") {
  const response = await fetch("/api/settings/api-key", { method });
  if (!response.ok) throw new Error(errorSchema.parse(await response.json()).error);
  return generatedSchema.parse(await response.json());
}
