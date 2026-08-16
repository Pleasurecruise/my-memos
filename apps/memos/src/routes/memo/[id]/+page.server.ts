import { error } from "@sveltejs/kit";
import { getMemo } from "$lib/server/memos";
import { stripMarkdown } from "$lib/server/og";

export const load = async ({
  params,
  platform,
  url,
  locals,
}: {
  params: { id: string };
  platform: App.Platform;
  url: URL;
  locals: App.Locals;
}) => {
  if (!platform) {
    error(500, "Cloudflare platform bindings are unavailable.");
  }

  const { id } = params;
  const memo = await getMemo(platform.env.DB, platform.env.MEMOS_BUCKET, id);

  if (!memo || (memo.visibility === "private" && !locals.user)) {
    error(404, "Memo not found.");
  }

  if (memo.visibility === "private") {
    return { memo, meta: { robots: "noindex, nofollow" } };
  }

  const plain = stripMarkdown(memo.content);
  const description =
    plain.length > 0
      ? plain.slice(0, 160) + (plain.length > 160 ? "…" : "")
      : "A memo from My Memos";
  const imageVersion = encodeURIComponent(memo.updatedAt);

  return {
    memo,
    meta: {
      title: description.slice(0, 60),
      description,
      ogImage: `${url.origin}/api/memos/${id}/og?v=${imageVersion}`,
      ogType: "article",
    },
  };
};
