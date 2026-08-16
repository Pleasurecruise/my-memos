import { z } from "zod";

export const memoSearchResultSchema = z.object({
  type: z.literal("memo-search-results"),
  query: z.string(),
  memos: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      tags: z.array(z.string()),
      createdAt: z.string(),
    }),
  ),
});

export type MemoSearchResult = z.infer<typeof memoSearchResultSchema>;

export function readMemoSearchResult(value: unknown): MemoSearchResult | null {
  const result = memoSearchResultSchema.safeParse(value);
  return result.success ? result.data : null;
}
