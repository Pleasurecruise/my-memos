import { env } from "cloudflare:workers";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ url }) => {
  const origin = env.BETTER_AUTH_URL || url.origin;
  return Response.json(
    {
      linkset: [
        {
          anchor: `${origin}/api/v1`,
          "service-desc": [
            { href: `${origin}/api/v1/openapi.json`, type: "application/vnd.oai.openapi+json" },
          ],
          "service-doc": [
            {
              href: "https://github.com/Pleasurecruise/my-memos/blob/main/docs/ARCHITECTURE.md#external-memo-integrations",
              type: "text/html",
            },
          ],
        },
      ],
    },
    {
      headers: {
        "Content-Type":
          'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
        Link: '</.well-known/api-catalog>; rel="api-catalog"',
      },
    },
  );
};
