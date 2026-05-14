# Architecture

This repository is a `pnpm` workspace with one deployable app and one shared UI package.

## Repository Layout

| Path                                                                 | Role                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------- |
| [apps/memos](/Users/pleasure1234/Github/my-memos/apps/memos)         | Main SvelteKit application deployed to Cloudflare Workers     |
| [packages/ui](/Users/pleasure1234/Github/my-memos/packages/ui)       | Shared Svelte UI components, theme tokens, and local demo app |
| [docs](/Users/pleasure1234/Github/my-memos/docs)                     | Maintainer-facing documentation                               |
| [wrangler.toml](/Users/pleasure1234/Github/my-memos/wrangler.toml:1) | Cloudflare Worker entrypoint and bindings                     |

## High-Level System

```text
Browser
  -> SvelteKit routes in apps/memos/src/routes
  -> server load functions and API handlers
  -> repository/auth helpers in apps/memos/src/lib/server
  -> Cloudflare bindings
     - D1: structured memo metadata + auth tables
     - R2: full memo markdown + agent memory files
     - KV: derived caches
```

## Workspace Structure

### App: `apps/memos`

The deployable application is the `@my-memos/app` workspace package defined in [apps/memos/package.json](/Users/pleasure1234/Github/my-memos/apps/memos/package.json:1).

Key areas:

- [apps/memos/src/routes](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes)
  Page routes and API endpoints.
- [apps/memos/src/lib/server](/Users/pleasure1234/Github/my-memos/apps/memos/src/lib/server)
  Server-only auth, filters, and memo persistence helpers.
- [apps/memos/src/lib/components](/Users/pleasure1234/Github/my-memos/apps/memos/src/lib/components)
  App-specific Svelte UI not exported as reusable package components.
- [apps/memos/migrations](/Users/pleasure1234/Github/my-memos/apps/memos/migrations)
  D1 schema migrations.
- [apps/memos/worker.ts](/Users/pleasure1234/Github/my-memos/apps/memos/worker.ts:1)
  Worker entry that exports the built SvelteKit handler.

### Package: `packages/ui`

The shared package `@my-memos/ui` exports:

- reusable UI primitives from [packages/ui/src/components](/Users/pleasure1234/Github/my-memos/packages/ui/src/components)
- theme and utility helpers from [packages/ui/src/lib](/Users/pleasure1234/Github/my-memos/packages/ui/src/lib)
- CSS entrypoints exposed in [packages/ui/package.json](/Users/pleasure1234/Github/my-memos/packages/ui/package.json:1)

It also contains a local demo surface in [packages/ui/dev](/Users/pleasure1234/Github/my-memos/packages/ui/dev) for component iteration.

## Request Model

### Public Pages

- `/` loads memos and tag counts with optional filters.
- Unauthenticated users can browse public memos.
- Authenticated users can browse all non-archived memos.

The main page load lives in [apps/memos/src/routes/+page.server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes/+page.server.ts:1).

### Archive Page

- `/archive` is authenticated only.
- Loads archived memos and tag counts.

Route loader: [apps/memos/src/routes/archive/+page.server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes/archive/+page.server.ts:1)

### Chat Page

- `/chat` is authenticated only.
- Uses an SSE API route for model output streaming.

Route loader: [apps/memos/src/routes/chat/+page.server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes/chat/+page.server.ts:1)

## Authentication

Authentication is implemented with Better Auth and initialized in [apps/memos/src/lib/server/auth.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/lib/server/auth.ts:1).

Current auth characteristics:

- database-backed sessions in D1
- Google OAuth configured as the social provider
- secure cookies enabled automatically when `BETTER_AUTH_URL` is `https`
- optional single-user gating through `ALLOWED_EMAIL`

Request bootstrapping happens in [apps/memos/src/hooks.server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/hooks.server.ts:1), which:

- constructs a Better Auth instance from Cloudflare bindings
- loads the current session
- attaches `locals.user` and `locals.session`
- delegates to `svelteKitHandler`

## Memo Storage Model

Memo persistence is split deliberately across D1 and R2.

### D1

Table defined in [apps/memos/migrations/0001_create_memos.sql](/Users/pleasure1234/Github/my-memos/apps/memos/migrations/0001_create_memos.sql:1):

- `id`
- `r2_key`
- `tags_json`
- `excerpt`
- `created_at`
- `updated_at`
- `visibility`
- `pinned`
- `archived`

Use D1 for:

- list queries
- filtering by date, tag, archive state, and visibility
- storing lightweight metadata

### R2

R2 stores:

- full memo markdown body
- chat support files such as `agent/PROMPT.md` and `agent/MEMORY.md`

This keeps D1 queries fast while preserving full content externally.

### KV

KV stores derived cache entries only:

- `memo:list`
- `memo:list:public`
- `memo:tags`
- `memo:tags:public`

Cache invalidation currently happens in repository writes.

## Server Domain Logic

Primary memo data access lives in [apps/memos/src/lib/server/memos/repository.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/lib/server/memos/repository.ts:1).

Responsibilities:

- map D1 rows to app `Memo` objects
- build filtered list queries
- cache unfiltered list results and tag counts in KV
- write full content to R2 during create and update
- invalidate cache after mutations

Important implementation detail:

- list/search behavior uses `excerpt` in D1 for fast filtering
- full content is only fetched from R2 when needed, notably in chat search results

## API Surface

### `/api/memos`

File: [apps/memos/src/routes/api/memos/+server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes/api/memos/+server.ts:1)

- `POST`
  Creates a memo for authenticated users.

### `/api/memos/[id]`

File: [apps/memos/src/routes/api/memos/[id]/+server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes/api/memos/[id]/+server.ts:1)

- `PATCH`
  Updates content, tags, visibility, pin state, or archive state.
- `DELETE`
  Deletes a memo and its stored content.

### `/api/chat`

File: [apps/memos/src/routes/api/chat/+server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes/api/chat/+server.ts:1)

Behavior:

- requires authentication
- loads prompt and memory markdown from R2
- calls Cloudflare AI Gateway through an OpenAI-compatible client
- streams `text/event-stream` SSE; each `data:` line is a JSON object:
  - `{ text: string }` — incremental text delta
  - `{ tool_call: string }` — model started a tool call (value is the tool name)
  - `{ error: string }` — stream-level error
  - `[DONE]` — end of stream sentinel
- exposes tools for tag listing, memo listing, memo search, and memory updates

## Type Boundaries

The runtime contract for Cloudflare bindings is declared in [apps/memos/src/app.d.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/app.d.ts:1). Keep this file in sync with:

- `wrangler.toml`
- any new secrets or bindings
- any platform-dependent server code

If these drift, the app may still compile but fail at runtime.

## Known Inconsistencies To Watch

- The SQL schema allows `visibility IN ('public', 'protected', 'private')`, but API validation only accepts `public` and `private`.
- Memo search currently queries `excerpt LIKE ?` before optionally loading full content from R2, so deep content not present in the excerpt will not be discovered by search.
- Root `wrangler.toml` is effectively production-shaped rather than environment-sliced.

These are not blockers for documentation, but they matter if you change behavior later.
