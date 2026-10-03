import { env } from "cloudflare:workers";
import { createMemo } from "#lib/server/memos/index.ts";
import { parseXPostId, xPostResponseSchema } from "#lib/server/x-import.ts";
import { z } from "zod";
import type { RequestHandler } from "./$types";

const importSchema = z.object({
  url: z.string().trim().min(1),
  visibility: z.enum(["public", "private"]),
});

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const result = importSchema.safeParse(await request.json());
  if (!result.success)
    return Response.json({ error: "A valid X post URL is required." }, { status: 400 });

  const postId = parseXPostId(result.data.url);
  if (!postId) return Response.json({ error: "Paste a valid X post URL." }, { status: 400 });

  const response = await fetch(`https://api.fxtwitter.com/status/${postId}`, {
    headers: { "User-Agent": "my-memos/1.0" },
  });
  if (!response.ok) {
    const message = response.status === 404 ? "X post not found." : "Could not fetch X post.";
    return Response.json({ error: message }, { status: response.status === 404 ? 404 : 502 });
  }

  const parsed = xPostResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    return Response.json({ error: "X returned an unsupported post response." }, { status: 502 });
  }

  const { text, url, author, media } = parsed.data.tweet;
  let content = text;
  if (media.photos?.length) {
    const images = media.photos.map(({ url: photoUrl, altText }) => {
      const alt = altText
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\\/g, "\\\\")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]");
      return `![${alt}](<${photoUrl}>)`;
    });
    content += `\n\n${images.join("\n\n")}`;
  }
  content += `\n\n— ${author.name} (@${author.screen_name})\n${url}`;
  const memo = await createMemo(env.DB, env.MEMOS_BUCKET, {
    content,
    visibility: result.data.visibility,
    tags: [],
    favorite: true,
  });
  return Response.json({ memo }, { status: 201 });
};
