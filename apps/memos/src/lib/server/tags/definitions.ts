import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import { tagDefinitions, type TagDefinition } from "#lib/server/db/schema.ts";

export type { TagDefinition };

export const tagNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[\p{Letter}\p{Number}_\-/]+$/u, "Tag names may contain letters, numbers, _, - and /.");

export const tagDefinitionInputSchema = z.object({
  kind: z.enum(tagDefinitions.kind.enumValues),
  description: z.string().trim().min(1).max(200),
});

export async function listTagDefinitions(d1: D1Database): Promise<TagDefinition[]> {
  return drizzle(d1)
    .select()
    .from(tagDefinitions)
    .orderBy(asc(tagDefinitions.kind), asc(tagDefinitions.name));
}

export async function upsertTagDefinition(
  d1: D1Database,
  definition: TagDefinition,
): Promise<TagDefinition> {
  await drizzle(d1)
    .insert(tagDefinitions)
    .values(definition)
    .onConflictDoUpdate({
      target: tagDefinitions.name,
      set: { kind: definition.kind, description: definition.description },
    });
  return definition;
}

export async function deleteTagDefinition(d1: D1Database, name: string): Promise<boolean> {
  const deleted = await drizzle(d1)
    .delete(tagDefinitions)
    .where(eq(tagDefinitions.name, name))
    .returning();
  return deleted.length > 0;
}
