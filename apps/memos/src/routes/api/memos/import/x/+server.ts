import { createMemo } from "$lib/server/memos";
import { parseXPostId, xPostResponseSchema } from "$lib/server/x-import";
import { json } from "@sveltejs/kit";
import { z } from "zod";
import type { RequestHandler } from "./$types";

const importSchema = z.object({
  url: z.string().trim().min(1),
  visibility: z.enum(["public", "private"]),
});

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized." }, { status: 401 });
  if (!platform) {
    return json({ error: "Cloudflare platform bindings are unavailable." }, { status: 500 });
  }

  const result = importSchema.safeParse(await request.json());
  if (!result.success) return json({ error: "A valid X post URL is required." }, { status: 400 });

  const postId = parseXPostId(result.data.url);
  if (!postId) return json({ error: "Paste a valid X post URL." }, { status: 400 });

  const response = await fetch(`https://api.fxtwitter.com/status/${postId}`, {
    headers: { "User-Agent": "my-memos/1.0" },
  });
  if (!response.ok) {
    const message = response.status === 404 ? "X post not found." : "Could not fetch X post.";
    return json({ error: message }, { status: response.status === 404 ? 404 : 502 });
  }

  const parsed = xPostResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    return json({ error: "X returned an unsupported post response." }, { status: 502 });
  }

  const { text, url, author } = parsed.data.tweet;
  const content = `${text}\n\n— ${author.name} (@${author.screen_name})\n${url}`;
  const memo = await createMemo(platform.env.DB, platform.env.MEMOS_BUCKET, {
    content,
    visibility: result.data.visibility,
    tags: [],
    favorite: true,
  });
  return json({ memo }, { status: 201 });
};
