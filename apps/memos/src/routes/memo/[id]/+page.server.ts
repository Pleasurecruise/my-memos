import { env } from "cloudflare:workers";
import { error } from "@sveltejs/kit";
import { getMemo } from "#lib/server/memos/index.ts";
import { memoSummary, memoTitle, memoUrl, siteOrigin } from "#lib/server/discovery/index.ts";
import { SITE_NAME } from "#lib/site.ts";

export const load = async ({
  params,
  url,
  locals,
}: {
  params: { id: string };
  url: URL;
  locals: App.Locals;
}) => {
  const { id } = params;
  const memo = await getMemo(env.DB, env.MEMOS_BUCKET, id);

  if (!memo || (memo.visibility === "private" && !locals.user)) {
    error(404, "Memo not found.");
  }

  if (memo.visibility === "private" || memo.archived) {
    return { memo, meta: { robots: "noindex, nofollow" } };
  }

  const origin = siteOrigin(env, url);
  const canonical = memoUrl(origin, id);
  const description = memoSummary(memo.content);
  const title = memoTitle(memo.content);
  const imageVersion = encodeURIComponent(memo.updatedAt);
  const ogImage = new URL(`/api/memos/${id}/og?v=${imageVersion}`, origin).href;

  return {
    memo,
    meta: {
      title,
      description,
      canonical,
      ogImage,
      ogType: "article",
      publishedTime: memo.createdAt,
      modifiedTime: memo.updatedAt,
      tags: memo.tags,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "SocialMediaPosting",
        headline: title,
        description,
        url: canonical,
        mainEntityOfPage: canonical,
        datePublished: memo.createdAt,
        dateModified: memo.updatedAt,
        keywords: memo.tags,
        image: ogImage,
        articleBody: memo.content,
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: new URL("/", origin).href },
      },
    },
  };
};
