import { error } from "@sveltejs/kit";
import { getMemo } from "$lib/server/memos";
import { renderOgImage, stripMarkdown } from "$lib/server/og";

export const GET = async ({
  params,
  platform,
  url,
}: {
  params: { id: string };
  platform: App.Platform;
  url: URL;
}) => {
  if (!platform) {
    error(500, "Cloudflare platform bindings are unavailable.");
  }

  const { id } = params;
  const memo = await getMemo(platform.env.DB, platform.env.MEMOS_BUCKET, id);

  if (!memo || memo.visibility !== "public") {
    error(404, "Memo not found.");
  }

  const plain = stripMarkdown(memo.content);
  const title =
    plain.length > 0 ? plain.slice(0, 100) + (plain.length > 100 ? "…" : "") : "Untitled memo";
  const date = new Date(memo.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const svg = renderOgImage({
    title,
    tags: memo.tags,
    date,
    domain: url.hostname,
    siteName: "My Memos",
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
};
