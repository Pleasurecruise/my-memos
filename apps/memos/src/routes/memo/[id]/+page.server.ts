import { error } from "@sveltejs/kit";
import { getMemo } from "$lib/server/memos";
import { stripMarkdown } from "$lib/server/og";

export const load = async ({
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
  const description =
    plain.length > 0
      ? plain.slice(0, 160) + (plain.length > 160 ? "…" : "")
      : "A memo from My Memos";

  return {
    memo,
    meta: {
      title: description.slice(0, 60),
      description,
      ogImage: `${url.origin}/api/memos/${id}/og`,
      ogType: "article",
    },
  };
};
