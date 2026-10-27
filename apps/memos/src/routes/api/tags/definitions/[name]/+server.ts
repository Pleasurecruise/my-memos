import { env } from "cloudflare:workers";
import { isOwnerRequest } from "#lib/server/apikey/index.ts";
import {
  deleteTagDefinition,
  tagDefinitionInputSchema,
  tagNameSchema,
  upsertTagDefinition,
} from "#lib/server/tags/index.ts";
import type { RequestHandler } from "./$types";

export const PUT: RequestHandler = async ({ request, locals, params }) => {
  if (!(await isOwnerRequest(request, locals.user, env.API_KEY))) {
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  const name = tagNameSchema.safeParse(params.name);
  if (!name.success) return Response.json({ error: "Tag name is invalid." }, { status: 400 });
  const input = tagDefinitionInputSchema.safeParse(await request.json());
  if (!input.success) {
    return Response.json({ error: "Tag definition is invalid." }, { status: 400 });
  }

  return Response.json({
    definition: await upsertTagDefinition(env.DB, { name: name.data, ...input.data }),
  });
};

export const DELETE: RequestHandler = async ({ request, locals, params }) => {
  if (!(await isOwnerRequest(request, locals.user, env.API_KEY))) {
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  const name = tagNameSchema.safeParse(params.name);
  if (!name.success) return Response.json({ error: "Tag name is invalid." }, { status: 400 });
  if (!(await deleteTagDefinition(env.DB, name.data))) {
    return Response.json({ error: "Tag definition not found." }, { status: 404 });
  }

  return new Response(null, { status: 204 });
};
