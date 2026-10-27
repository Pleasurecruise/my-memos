import { env } from "void/env";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = () => {
  const origin = env.BETTER_AUTH_URL;
  return Response.json(
    {
      linkset: [
        {
          anchor: `${origin}/api`,
          "service-desc": [
            { href: `${origin}/api/openapi.json`, type: "application/vnd.oai.openapi+json" },
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
