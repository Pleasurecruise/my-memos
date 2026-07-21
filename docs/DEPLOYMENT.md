# Deployment

This repository is deployed as a Cloudflare Worker backed by D1, KV, and R2.

The deploy target is defined in [apps/memos/wrangler.jsonc](/Users/pleasure1234/Github/my-memos/apps/memos/wrangler.jsonc:1). Void's framework integration is configured beside it in [apps/memos/void.json](/Users/pleasure1234/Github/my-memos/apps/memos/void.json:1). The runnable app is the SvelteKit project in [apps/memos](/Users/pleasure1234/Github/my-memos/apps/memos), built to Cloudflare output and served by the generated SvelteKit Worker entry.

## Runtime Shape

- App runtime: `SvelteKit + @sveltejs/adapter-cloudflare + Void`
- Package manager: `pnpm`
- Workspace layout: `apps/*` and `packages/*`
- Worker name: `my-memos`
- Public domain: `https://memos.you-find.me`
- Workers.dev route: disabled via `workers_dev = false`
- Static assets binding: `ASSETS`
- Database: `D1` via binding `DB`
- Cache: `KV` via binding `MEMOS_CACHE`
- Object storage: `R2` via binding `MEMOS_BUCKET`

## Required Cloudflare Resources

The current Worker expects these bindings to exist:

| Binding        | Type   | Purpose                                          |
| -------------- | ------ | ------------------------------------------------ |
| `DB`           | D1     | Memo metadata and Better Auth tables             |
| `MEMOS_CACHE`  | KV     | Derived caches such as tag counts                |
| `MEMOS_BUCKET` | R2     | Full markdown memo bodies and agent memory files |
| `ASSETS`       | Assets | Built SvelteKit client assets                    |

Current binding names and IDs live in [apps/memos/wrangler.jsonc](/Users/pleasure1234/Github/my-memos/apps/memos/wrangler.jsonc:1). Runtime TypeScript declarations live in [apps/memos/src/app.d.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/app.d.ts:1). Void is used for framework build and deployment integration, while Wrangler remains the source of truth for the existing D1, KV, and R2 bindings.

## Required Environment Variables

`App.Platform.env` is declared in [apps/memos/src/app.d.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/app.d.ts:1). In practice, this app needs:

| Variable                   | Required     | Purpose                                      |
| -------------------------- | ------------ | -------------------------------------------- |
| `BETTER_AUTH_URL`          | yes          | Public base URL used by Better Auth          |
| `BETTER_AUTH_SECRET`       | yes          | Better Auth signing secret                   |
| `GOOGLE_CLIENT_ID`         | yes          | Google OAuth client ID                       |
| `GOOGLE_CLIENT_SECRET`     | yes          | Google OAuth client secret                   |
| `ALLOWED_EMAIL`            | yes          | Limits account creation to one allowed email |
| `CF_AIG_TOKEN`             | yes for chat | Cloudflare AI Gateway auth token             |
| `CF_ACCOUNT_ID`            | yes for chat | Cloudflare account ID for AI Gateway         |
| `CF_GATEWAY_NAME`          | yes for chat | Cloudflare AI Gateway name                   |
| `TAVILY_API_KEY`           | yes for chat | Tavily API key for web search                |
| `OPENAI_API_KEY`           | unused       | Declared but not read at runtime             |
| `AI_GATEWAY_PROVIDER_SLUG` | unused       | Declared but not read at runtime             |

Local development uses [apps/memos/.env.example](/Users/pleasure1234/Github/my-memos/apps/memos/.env.example:1) as the template. Copy it to `apps/memos/.env.local`; Void and Vite load it from the application package during development. Production builds switch Vite's `envDir` to `.void/build-env`, so local secrets are not copied into Worker vars. Production secrets should be managed with Wrangler secrets and environment vars, not committed files.

## Build And Deployment Flow

From repository root:

```bash
pnpm install
pnpm build
pnpm d1:migrate:remote
pnpm deploy
```

What each step does:

- `pnpm build`
  Builds `@my-memos/app` and writes Cloudflare output to `apps/memos/.svelte-kit/cloudflare`.
- `pnpm d1:migrate:remote`
  Applies SQL migrations from `apps/memos/migrations` to the remote D1 database bound as `DB`.
- `pnpm deploy`
  Runs `void deploy` from the `@my-memos/app` workspace, builds the SvelteKit framework target, and uploads its Worker and assets using the app-local configuration.

## Local Development

Useful commands from repo root:

```bash
pnpm dev
pnpm dev:wrangler
pnpm d1:migrate:local
pnpm lint
pnpm check
```

- `pnpm dev`
  Starts the app workspace with `vp dev`; `voidPlugin()` provides local D1, KV, and R2 bindings. It does not access production storage.
- `pnpm dev:wrangler`
  Builds first, then runs `wrangler dev --remote` with `apps/memos/wrangler.jsonc`. Use this only when deliberately testing against the remote Cloudflare resources.
- `pnpm d1:migrate:local`
  Applies D1 migrations to the app-local `apps/memos/.wrangler/state` used by Void's Cloudflare development runtime.
- `pnpm lint`
  Runs oxlint across the workspace.
- `pnpm format`
  Formats source files with oxfmt.
- `pnpm check`
  Runs format check, lint, and type checking.

## Data And Auth Migration Notes

The app relies on two migration groups:

- [apps/memos/migrations/0001_create_memos.sql](/Users/pleasure1234/Github/my-memos/apps/memos/migrations/0001_create_memos.sql:1)
  Creates the `memos` table and indexes.
- [apps/memos/migrations/0002_auth_tables.sql](/Users/pleasure1234/Github/my-memos/apps/memos/migrations/0002_auth_tables.sql:1)
  Creates Better Auth tables: `user`, `session`, `account`, `verification`.

Run migrations before the first deployment and whenever schema changes are introduced.

### Adding a New Schema Change

Wrangler D1 SQL migrations are the source of truth. The workflow is:

```bash
# create a numbered SQL file in apps/memos/migrations/
pnpm d1:migrate:local    # verify locally
pnpm d1:migrate:remote   # apply to production
```

When a migration changes the memo schema, update the Drizzle schema mirror in
`apps/memos/src/lib/server/db/schema.ts` in the same change. Do not commit
Drizzle-generated initial snapshots beside Wrangler migrations; they are a separate
migration system and can attempt to recreate existing tables.

## Post-Deployment Checks

Verify these paths after deployment:

- `/`
  Public memo list should render.
- `/archive`
  Should redirect unauthenticated users to login.
- `/chat`
  Requires an authenticated session and working AI bindings.
- `/note`
  Requires authenticated session; lists notes from R2.
- `/api/memos`
  Create memo endpoint; requires auth.
- `/api/chat`
  SSE endpoint backed by AI Gateway, D1, and R2.
- `/api/chat/consolidate`
  POST triggers memory consolidation (authenticated).
- `/api/notes`
  POST creates a note (authenticated).

## Operational Notes

- Memo bodies are stored in both `R2` (canonical) and D1's `excerpt` field. Memo lists are paginated from D1; KV is cache only for derived data such as tag counts. Deleting KV entries should not lose source data.
- The chat route reads `agent/PROMPT.md` and `agent/MEMORY.md` from `MEMOS_BUCKET`. Missing files degrade gracefully, but chat behavior will change.
- Auto-dream memory maintenance may update `agent/MEMORY.md` after completed chat responses.
- Long-form notes live in R2 under `blog/` prefix, with KV caches for compiled HTML. The note editor (`/note/[...slug]`) reads and updates R2 directly; the API endpoints (`/api/notes`) manage creation and deletion.
- Local development keeps D1, KV, and R2 state under `apps/memos/.wrangler/state`. The production bucket name remains in Wrangler configuration, while `pnpm dev:wrangler` is the explicit opt-in path for remote storage access.
- `apps/memos/wrangler.jsonc` currently includes concrete IDs and a production URL. Keep it aligned with `apps/memos/void.json` and `apps/memos/src/app.d.ts`, and avoid mixing environments in one config unless you add explicit environment sections.
