import { z } from "zod";

export const xPostResponseSchema = z.object({
  tweet: z.object({
    text: z.string().trim().min(1),
    url: z.url(),
    author: z.object({
      name: z.string().trim().min(1),
      screen_name: z.string().trim().min(1),
    }),
  }),
});

export function parseXPostId(sourceUrl: string): string | null {
  if (!URL.canParse(sourceUrl)) return null;
  const url = new URL(sourceUrl);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (url.protocol !== "https:" || !["x.com", "twitter.com"].includes(host)) return null;
  const match = url.pathname.match(/^\/[^/]+\/status\/(\d{2,20})\/?$/);
  if (!match) return null;
  return match[1];
}
