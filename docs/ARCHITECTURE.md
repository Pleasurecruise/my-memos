# Architecture

This repository is a `pnpm` workspace with one deployable app and two reusable packages.

## Repository Layout

| Path                                                                                         | Role                                                          |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [apps/memos](/Users/pleasure1234/Github/my-memos/apps/memos)                                 | Main SvelteKit application deployed to Cloudflare Workers     |
| [packages/ui](/Users/pleasure1234/Github/my-memos/packages/ui)                               | Shared Svelte UI components, theme tokens, and local demo app |
| `packages/ai-core`                                                                           | Platform-neutral pi Agent runtime and MCP client adapter      |
| [docs](/Users/pleasure1234/Github/my-memos/docs)                                             | Maintainer-facing documentation                               |
| [apps/memos/wrangler.jsonc](/Users/pleasure1234/Github/my-memos/apps/memos/wrangler.jsonc:1) | Cloudflare Worker entrypoint and bindings                     |

## High-Level System

```text
Browser (in-memory Svelte Chat store)
  -> SvelteKit POST /api/chat with the complete current-page transcript
  -> typed NDJSON agent events
  -> @my-memos/ai-core / pi Agent
  -> in-process dual-era MCP client (prefers 2026-07-28, falls back to 2025-11-25) -> /api/mcp handler
  -> typed domain operations in apps/memos/src/lib/server
  -> Cloudflare bindings
     - D1: structured memo metadata + auth tables
     - R2: full memo markdown + agent memory files
     - KV: derived caches
```

## Workspace Structure

### App: `apps/memos`

The deployable application is the `@my-memos/app` workspace package defined in [apps/memos/package.json](/Users/pleasure1234/Github/my-memos/apps/memos/package.json:1).

Void is configured at [apps/memos/void.json](/Users/pleasure1234/Github/my-memos/apps/memos/void.json:1), beside the SvelteKit package it prepares and deploys. The repository-root scripts delegate Void commands to this workspace package. D1 remains owned by the existing Wrangler migrations and `App.Platform` contract; the app does not opt into Void's `void/db` schema or migration layer.

Key areas:

- [apps/memos/src/routes](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes)
  Page routes and API endpoints.
- [apps/memos/src/lib/server](/Users/pleasure1234/Github/my-memos/apps/memos/src/lib/server)
  Server-only auth, filters, and memo persistence helpers.
  - [apps/memos/src/lib/server/db/schema.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/lib/server/db/schema.ts)
    Drizzle ORM schema for the `memos` table; exports `MemoRow` inferred type.
  - `apps/memos/src/lib/server/mcp`
    MCP server, authentication, schemas, structured errors, typed domain operations, and MCP-only utilities. Shared contracts live in `types.ts`; implementation files import them instead of redeclaring local aliases.
- [apps/memos/src/lib/components](/Users/pleasure1234/Github/my-memos/apps/memos/src/lib/components)
  App-specific Svelte UI not exported as reusable package components.
  Contains two layout generations:
  - `views/` — default layout: `AppShell` + `Sidebar`, `Home`, `Chat`, `Archive`, `Note`. Sidebar-based with timeline feed.
  - `views-legacy/` — legacy layout kept for comparison via the in-page toggle button.
- [apps/memos/migrations](/Users/pleasure1234/Github/my-memos/apps/memos/migrations)
  D1 schema migrations applied by wrangler. These numbered SQL files are the source of truth; the Drizzle schema mirrors the runtime table shape for query building.
- [apps/memos/worker.ts](/Users/pleasure1234/Github/my-memos/apps/memos/worker.ts:1)
  Worker entry that exports the built SvelteKit handler.

### Package: `packages/ui`

The shared package `@my-memos/ui` exports:

- reusable UI primitives from [packages/ui/src/components](/Users/pleasure1234/Github/my-memos/packages/ui/src/components)
  - Includes the `Timeline` component and `TimelineGroup` type used by the new layout feed.
- theme and utility helpers from [packages/ui/src/lib](/Users/pleasure1234/Github/my-memos/packages/ui/src/lib)
- CSS entrypoints exposed in [packages/ui/package.json](/Users/pleasure1234/Github/my-memos/packages/ui/package.json:1)

It also contains a local demo surface in [packages/ui/dev](/Users/pleasure1234/Github/my-memos/packages/ui/dev) for component iteration.

### Package: `packages/ai-core`

`@my-memos/ai-core` pins `@earendil-works/pi-agent-core` and `@earendil-works/pi-ai` to the same exact version. It owns pi Agent construction, OpenAI-compatible model descriptors, MCP version negotiation (preferring `2026-07-28` discovery with a `2025-11-25` initialize fallback), MCP-to-pi tool adaptation, cancellation, and runtime events. It has no application tool names, SvelteKit, Better Auth, D1, R2, KV, or Cloudflare imports. Mutation sequencing is derived from standard MCP tool annotations. It deliberately has no budgets, snapshots, persistence, thread IDs, retry, or regeneration API.

Its public contracts are collected in `packages/ai-core/src/types.ts`; small pure conversion helpers live in `utils.ts`. Tests are isolated under each package or app's `src/__tests__` directory. Server code imports hashtag parsing directly from `apps/memos/src/lib/utils/tags.ts`, so it never loads the browser navigation utilities.

The app uses a small local chat protocol under `apps/memos/src/lib/chat`: shared message/event types, Zod validation at the HTTP boundary, and a page-local Svelte store. One assistant UI turn contains the ordered pi steps around tool execution, so the page renders one message/avatar while transcript conversion still restores `assistant -> toolResult -> assistant` ordering. It does not depend on the Vercel AI SDK. TypeBox remains an implementation dependency of pi itself, but `ai-core` consumes its schema types through `@earendil-works/pi-ai` instead of declaring TypeBox directly.

## Request Model

### Public Pages

- `/` loads memos and tag counts with optional filters.
- Unauthenticated users can browse public memos.
- Authenticated users can browse all non-archived memos.
- Authenticated users can toggle `view=public` to browse only public memos without private memo data in the page payload.
- The new home search control accepts `sort=updated` to show card results ordered by `updated_at`; the default timeline remains grouped by `created_at`.

The main page load lives in [apps/memos/src/routes/+page.server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes/+page.server.ts:1).

### Archive Page

- `/archive` is authenticated only.
- Loads archived memos and tag counts.

Route loader: [apps/memos/src/routes/archive/+page.server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes/archive/+page.server.ts:1)

### Chat Page

- `/chat` is authenticated only.
- Uses an NDJSON API route for model output streaming.
- Chat messages exist only in the current page's `Chat` instance. Refreshing or leaving the page discards them.
- Every request sends the full page transcript; the server performs one stateless pi Agent run.

Route loader: [apps/memos/src/routes/chat/+page.server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes/chat/+page.server.ts:1)

### Note Pages

- `/note` and `/note/[...slug]` are authenticated only.
- Browse and edit long-form markdown notes stored in R2 under `blog/` prefix.
- Supports categories, table of contents, and visual blocks.

Route loaders:

- [apps/memos/src/routes/note/+page.server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes/note/+page.server.ts:1)
- [apps/memos/src/routes/note/[...slug]/+page.server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes/note/[...slug]/+page.server.ts:1)

## Authentication

Authentication is implemented with Better Auth and initialized in [apps/memos/src/lib/server/auth.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/lib/server/auth.ts:1).

Current auth characteristics:

- database-backed sessions in D1
- Google OAuth configured as the social provider
- secure cookies enabled automatically when `BETTER_AUTH_URL` is `https`
- required single-user gating through `ALLOWED_EMAIL`

Request bootstrapping happens in [apps/memos/src/hooks.server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/hooks.server.ts:1), which:

- constructs a Better Auth instance from Cloudflare bindings
- loads the current session
- attaches `locals.user` and `locals.session`
- delegates to `svelteKitHandler`

## Memo Storage Model

Memo persistence is split deliberately across D1 and R2.

### D1

Table defined in [apps/memos/migrations/0001_create_memos.sql](/Users/pleasure1234/Github/my-memos/apps/memos/migrations/0001_create_memos.sql:1). The Drizzle schema mirror lives in [apps/memos/src/lib/server/db/schema.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/lib/server/db/schema.ts:1).

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

### R2

R2 stores:

- full memo markdown body
- chat support files such as `agent/PROMPT.md` and `agent/MEMORY.md`
- long-form notes under `blog/` prefix, with custom metadata (title, timestamps) and KV-compiled caches

During `pnpm dev`, this binding uses Wrangler's app-local simulated R2 state. Remote storage is accessed only through an explicit remote development or deployment command.

### KV

KV stores derived cache entries only:

- `memo:tags`
- `memo:tags:public`
- short-lived `agent:memory-update:<message-id>` dedupe/status entries; never chat content

Memo lists are **not** cached in KV — full-list JSON blobs caused KV size/corruption issues and CPU rate limits on Workers. Instead, lists are paginated via cursor-based `limit=25` queries directly against D1 indexes.

Cache invalidation currently happens in repository writes (tag counts only).

## Server Domain Logic

Primary memo data access lives in [apps/memos/src/lib/server/memos/repository.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/lib/server/memos/repository.ts:1).

Responsibilities:

- map D1 rows to app `Memo` objects via Drizzle ORM (`drizzle-orm/d1`)
- build filtered list queries using Drizzle operators
- cache unfiltered list results and tag counts in KV
- write full content to R2 during create and update
- invalidate cache after mutations
- blog/note compilation pipeline in `apps/memos/src/lib/server/blog` for KV-cached HTML rendering, TOC generation, and visual block extraction

The Drizzle schema (`apps/memos/src/lib/server/db/schema.ts`) is the authoritative source for the `memos` table shape and exports `MemoRow` via `typeof memos.$inferSelect`, eliminating hand-written row types.

Agent tools are defined once as MCP tools in `apps/memos/src/lib/server/mcp`. The in-product Agent discovers them over an in-process modern MCP transport; it never imports implementations directly.

## API Surface

### `/api/memos`

File: [apps/memos/src/routes/api/memos/+server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes/api/memos/+server.ts:1)

- `GET`
  Paginated memo list. Accepts `cursor` (base64-encoded compound cursor), `limit` (default 25, max 100), `search`, `date`, `tags` (comma-separated), `publicOnly`, `archivedOnly`, `sortByUpdated` query params. Returns `{ memos: Memo[], nextCursor: string | null }`. Used by the client for infinite-scroll loading.
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
- loads prompt and memory from R2 to build the system context
- model: `deepseek-chat` through Cloudflare AI Gateway's provider-native DeepSeek endpoint; the Gateway injects the configured BYOK provider key
- pi `Agent` is the sole server-side loop owner and runs until natural completion, cancellation, upstream failure, or platform termination
- streams newline-delimited, typed JSON events for assistant text and tool parts
- forwards one complete tool input when execution starts; cumulative argument deltas stay server-side to avoid quadratic serialization and repeated visual renders
- request cancellation propagates to pi, the model request, and MCP tool calls
- after success, `platform.ctx.waitUntil()` updates memory from only the latest user turn and newly generated assistant reply

### `/api/mcp`

File: `apps/memos/src/routes/api/mcp/+server.ts`

- single stateless `POST` endpoint serving MCP `2026-07-28` plus a stateless `2025-11-25` initialize fallback; protocol sessions are not issued and session headers are rejected
- external clients authenticate with `Authorization: Bearer <MCP_API_KEY>`
- the fixed key has all remotely exposed tool permissions; no token table, token-management API, or scope store exists
- external tools: `get_tags`, `list_memos`, `search_memos`, `create_memo`, `update_memo`, `delete_memo`, `web_search`, `fetch_raw`, `fetch_url`, `github_read`, `lookup_docs`
- in-product-only tools: `render_chart`, `render_svg`, `render_mermaid`, `render_widget`; these are UI rendering instructions and are never registered for API-key principals
- write tools execute sequentially; read and render tools may execute in parallel
- URL-reading tools accept only public HTTP(S) targets without embedded credentials, reject localhost/private/link-local address literals, and refuse redirects; Workers also enables `global_fetch_strictly_public` as a runtime-level egress boundary

## Memory Update Lifecycle

`agent/PROMPT.md` and `agent/MEMORY.md` are loaded from R2 with a short TTL and ETag validation. A successful chat schedules a no-tool model call in the background. Only durable, explicit user facts are eligible. Unchanged output is not written. Changed memory uses conditional R2 writes; one ETag conflict triggers a fresh read and one recomputation. A second conflict or model failure is logged without changing the completed chat response. Raw transcripts are never persisted.

### `/api/notes`

File: [apps/memos/src/routes/api/notes/+server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes/api/notes/+server.ts:1)

- `POST` creates a new note (authenticated).

### `/api/notes/[...slug]`

File: [apps/memos/src/routes/api/notes/[...slug]/+server.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/routes/api/notes/[...slug]/+server.ts:1)

- `PATCH` updates a note's content, title, or category (authenticated).
- `DELETE` deletes a note (authenticated).

## Type Boundaries

The runtime contract for Cloudflare bindings is declared in [apps/memos/src/app.d.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/app.d.ts:1). Keep this file in sync with:

- `apps/memos/wrangler.jsonc`
- any new secrets or bindings
- any platform-dependent server code

If these drift, the app may still compile but fail at runtime.

## Known Inconsistencies To Watch

- `apps/memos/wrangler.jsonc` is production-shaped rather than environment-sliced.
- Schema changes should be made as Wrangler SQL migrations first, then mirrored in the Drizzle schema. Do not mix Void- or Drizzle-generated migrations with Wrangler-applied SQL files.

These do not block the current runtime, but they matter when changing deployment or storage behavior.
