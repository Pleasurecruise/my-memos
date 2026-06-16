import { error } from "@sveltejs/kit";
import { getMemo } from "$lib/server/memos";
import { renderOgImage, renderOgPng, stripMarkdown } from "$lib/server/og";
import { readOgImageKv, writeOgImageKv } from "$lib/server/og/cache";

const SVG_FORMAT = "svg";

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

  if (url.searchParams.get("format") === SVG_FORMAT) {
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }

  const cacheKey = { id, updatedAt: memo.updatedAt, format: "png" as const };
  const cached = await readOgImageKv(platform.env.MEMOS_CACHE, cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  }

  const png = await renderOgPng(svg, platform.env.MEMOS_CACHE);
  await writeOgImageKv(platform.env.MEMOS_CACHE, cacheKey, png);

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
};
