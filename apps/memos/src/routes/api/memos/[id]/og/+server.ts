import { env } from "cloudflare:workers";
import { error } from "@sveltejs/kit";
import { getMemo } from "#lib/server/memos/index.ts";
import { renderOgImage, renderOgPng, stripMarkdown } from "#lib/server/og/index.ts";
import { readOgImageKv, writeOgImageKv } from "#lib/server/og/cache.ts";

const SVG_FORMAT = "svg";

export const GET = async ({ params, url }: { params: { id: string }; url: URL }) => {
  const { id } = params;
  const memo = await getMemo(env.DB, env.MEMOS_BUCKET, id);

  if (!memo || memo.visibility !== "public") {
    error(404, "Memo not found.");
  }

  const [line = "Untitled memo"] = memo.content.split("\n").map(stripMarkdown).filter(Boolean);
  const date = new Date(memo.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const buildSvg = async () =>
    renderOgImage({ line, meta: [date, ...memo.tags.slice(0, 1)].join(" · ") });

  if (url.searchParams.get("format") === SVG_FORMAT) {
    return new Response(await buildSvg(), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }

  const cacheKey = { id, updatedAt: memo.updatedAt, format: "png" as const };
  const cached = await readOgImageKv(env.MEMOS_CACHE, cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  }

  const png = await renderOgPng(await buildSvg(), env.MEMOS_CACHE);
  await writeOgImageKv(env.MEMOS_CACHE, cacheKey, png);

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
};
