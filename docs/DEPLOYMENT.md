# Deployment

This repository is deployed as a Cloudflare Worker backed by D1, KV, and R2.

The deploy target is defined in [wrangler.toml](/Users/pleasure1234/Github/my-memos/wrangler.toml:1). The runnable app is the SvelteKit project in [apps/memos](/Users/pleasure1234/Github/my-memos/apps/memos), built to Cloudflare output and served by the Worker entry in [apps/memos/worker.ts](/Users/pleasure1234/Github/my-memos/apps/memos/worker.ts:1).

## Runtime Shape

- App runtime: `SvelteKit + @sveltejs/adapter-cloudflare`
- Package manager: `pnpm`
- Workspace layout: `apps/*` and `packages/*`
- Worker name: `my-memos`
- Static assets binding: `ASSETS`
- Database: `D1` via binding `DB`
- Cache: `KV` via binding `MEMOS_CACHE`
- Object storage: `R2` via binding `MEMOS_BUCKET`

## Required Cloudflare Resources

The current Worker expects these bindings to exist:

| Binding        | Type   | Purpose                                          |
| -------------- | ------ | ------------------------------------------------ |
| `DB`           | D1     | Memo metadata and Better Auth tables             |
| `MEMOS_CACHE`  | KV     | Cached memo lists and tag counts                 |
| `MEMOS_BUCKET` | R2     | Full markdown memo bodies and agent memory files |
| `ASSETS`       | Assets | Built SvelteKit client assets                    |

Current binding names and IDs live in [wrangler.toml](/Users/pleasure1234/Github/my-memos/wrangler.toml:1).

## Required Environment Variables

`App.Platform.env` is declared in [apps/memos/src/app.d.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/app.d.ts:1). In practice, this app needs:

| Variable                   | Required              | Purpose                                      |
| -------------------------- | --------------------- | -------------------------------------------- |
| `BETTER_AUTH_URL`          | yes                   | Public base URL used by Better Auth          |
| `BETTER_AUTH_SECRET`       | yes                   | Better Auth signing secret                   |
| `GOOGLE_CLIENT_ID`         | yes                   | Google OAuth client ID                       |
| `GOOGLE_CLIENT_SECRET`     | yes                   | Google OAuth client secret                   |
| `ALLOWED_EMAIL`            | optional but expected | Limits account creation to one allowed email |
| `CF_AIG_TOKEN`             | yes for chat          | Cloudflare AI Gateway auth token             |
| `CF_ACCOUNT_ID`            | yes for chat          | Cloudflare account ID for AI Gateway         |
| `CF_GATEWAY_NAME`          | yes for chat          | Cloudflare AI Gateway name                   |
| `TAVILY_API_KEY`           | yes for chat          | Tavily API key for web search                |
| `OPENAI_API_KEY`           | unused                | Declared but not read at runtime             |
| `AI_GATEWAY_PROVIDER_SLUG` | unused                | Declared but not read at runtime             |

Local development uses [.dev.vars.example](/Users/pleasure1234/Github/my-memos/.dev.vars.example:1) as the template. Production secrets should be managed with Wrangler secrets and environment vars, not committed files.

## Build And Deployment Flow

From repository root:

```bash
pnpm install
pnpm build
pnpm d1:migrate:remote
wrangler deploy
```

What each step does:

- `pnpm build`
  Builds `@my-memos/app` and writes Cloudflare output to `apps/memos/.svelte-kit/cloudflare`.
- `pnpm d1:migrate:remote`
  Applies SQL migrations from `apps/memos/migrations` to the remote D1 database bound as `DB`.
- `wrangler deploy`
  Uploads the Worker entry, bundled server output, and assets using the root `wrangler.toml`.

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
  Starts the app workspace with `vp dev`.
- `pnpm dev:wrangler`
  Builds first, then runs `wrangler dev --remote`.
- `pnpm d1:migrate:local`
  Applies D1 migrations to local state under `.wrangler`.
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

Drizzle Kit and wrangler both operate on `apps/memos/migrations`. The workflow is:

```bash
pnpm drizzle:generate    # generates SQL diff + updates _meta/ snapshots in apps/memos/migrations/
pnpm d1:migrate:local    # verify locally
pnpm d1:migrate:remote   # apply to production
```

Commit both the generated `.sql` file and the updated `_meta/` folder — Drizzle Kit needs the snapshots to compute future diffs correctly.

## Post-Deployment Checks

Verify these paths after deployment:

- `/`
  Public memo list should render.
- `/archive`
  Should redirect unauthenticated users to login.
- `/chat`
  Requires an authenticated session and working AI bindings.
- `/api/memos`
  Create memo endpoint; requires auth.
- `/api/chat`
  SSE endpoint backed by AI Gateway, D1, and R2.

## Operational Notes

- Memo bodies are stored in both `R2` (canonical) and D1's `excerpt` field. KV is cache only. Deleting KV entries should not lose source data.
- The chat route reads `agent/PROMPT.md` and `agent/MEMORY.md` from `MEMOS_BUCKET`. Missing files degrade gracefully, but chat behavior will change.
- Auto-dream memory maintenance may update `agent/MEMORY.md` after completed chat responses.
- `wrangler.toml` currently includes concrete IDs and a production URL. Keep that file aligned with actual infrastructure, and avoid mixing environments in one config unless you add explicit `[env.*]` sections.
