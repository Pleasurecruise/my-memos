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

| Variable               | Required     | Purpose                                             |
| ---------------------- | ------------ | --------------------------------------------------- |
| `BETTER_AUTH_URL`      | yes          | Public base URL used by Better Auth                 |
| `BETTER_AUTH_SECRET`   | yes          | Better Auth signing secret                          |
| `GOOGLE_CLIENT_ID`     | yes          | Google OAuth client ID                              |
| `GOOGLE_CLIENT_SECRET` | yes          | Google OAuth client secret                          |
| `ALLOWED_EMAIL`        | yes          | Limits account creation to one allowed email        |
| `CF_ACCOUNT_ID`        | yes for chat | Cloudflare account containing the AI Gateway        |
| `CF_AIG_TOKEN`         | yes for chat | Authenticates the Gateway; it is not a provider key |
| `MCP_API_KEY`          | yes for MCP  | Fixed Bearer key for external MCP clients           |
| `TAVILY_API_KEY`       | yes for chat | Tavily API key for web search                       |

Local development uses [apps/memos/.env.example](/Users/pleasure1234/Github/my-memos/apps/memos/.env.example:1) as the template. Copy it to `apps/memos/.env.local`; Void and Vite load it from the application package during development. Production builds switch Vite's `envDir` to `.void/build-env`, so local secrets are not copied into Worker vars. Production secrets should be managed with Wrangler secrets and environment vars, not committed files.

## Build And Deployment Flow

From repository root:

```bash
pnpm install
pnpm check
pnpm test
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

Secret changes are a separate operation, not part of every code deployment. `wrangler secret put <NAME>` creates and immediately deploys a new Worker version. To prepare a secret without changing live traffic, use `wrangler versions secret put <NAME>` and deploy that version later with the code/configuration version you intend to release. `apps/memos/wrangler.jsonc` is the source of truth for non-secret bindings and required secret names.

Chat uses the provider-native `gateway.ai.cloudflare.com/v1/{account}/default/deepseek` endpoint with `deepseek-chat`. Configure the DeepSeek API key under the `default` Gateway's Provider Keys with the `default` alias. The Worker sends only `cf-aig-authorization`; Cloudflare injects the stored provider key, so these calls use provider BYOK rather than Unified Billing. The deprecated `/compat/chat/completions` endpoint and the Unified Billing REST endpoint are not used.

`apps/memos/vite.config.ts` targets `webworker` for SSR and resolves `workerd` before the `node` fallback. This selects the MCP client's Worker-specific validator shim while preserving Node-only export fallbacks used by transitive dependencies. Removing `workerd` makes Rolldown select the MCP Node validator and emit a top-level `createRequire`, which Cloudflare rejects during version validation; adding `browser` selects browser code that reads `window` when the Worker loads.

## Local Development

Useful commands from repo root:

```bash
pnpm dev
pnpm d1:migrate:local
pnpm lint
pnpm check
```

- `pnpm dev`
  Starts the app workspace with `vp dev`; `voidPlugin()` provides local D1, KV, and R2 bindings. It does not access production storage, so a production-only `agent/MEMORY.md` is expected to load as empty locally.
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
  Redirects unauthenticated users to `/`; there is no standalone `/login` route.
- `/chat`
  Requires an authenticated session and working AI bindings.
- `/note`
  Requires authenticated session; lists notes from R2.
- `/api/memos`
  Create memo endpoint; requires auth.
- `/api/chat`
  Stateless pi Agent NDJSON stream backed by Cloudflare AI Gateway, MCP, D1, and R2.
- `/api/mcp`
  Send either a modern `server/discover` request with MCP `2026-07-28` or a legacy `2025-11-25` `initialize` request, then list and call tools with the fixed Bearer key. External discovery must not contain the four in-product `render_*` tools. The legacy path is stateless: it does not issue `Mcp-Session-Id`, and supplied session IDs are rejected.
- `/api/notes`
  POST creates a note (authenticated).

### Remote MCP client

Use Streamable HTTP with one stateless endpoint and no session ID:

```json
{
  "mcpServers": {
    "my-memos": {
      "type": "streamable-http",
      "url": "https://memos.you-find.me/api/mcp",
      "headers": {
        "Authorization": "Bearer ${MCP_API_KEY}"
      }
    }
  }
}
```

Some clients name the transport `http` instead of `streamable-http`; the URL and header are unchanged. Clients may negotiate MCP `2026-07-28` through `server/discover` or use the `2025-11-25` `initialize` handshake. The endpoint does not issue protocol sessions, so clients must not invent or persist an `Mcp-Session-Id` when none was returned.

## Operational Notes

- Memo bodies are stored in both `R2` (canonical) and D1's `excerpt` field. Memo lists are paginated from D1; KV is cache only for derived data such as tag counts. Deleting KV entries should not lose source data.
- The chat route reads `agent/PROMPT.md` and `agent/MEMORY.md` from `MEMOS_BUCKET`. Missing files degrade gracefully, but chat behavior will change.
- Successful chats schedule memory maintenance with `waitUntil`; failures and R2 ETag conflicts never fail the already completed chat response.
- A live MCP key rotation with `wrangler secret put MCP_API_KEY` immediately creates and deploys a Worker version; use `wrangler versions secret put MCP_API_KEY` when preparing an undeployed version. There are no token-management routes or D1 token records.
- Long-form notes live in R2 under `blog/` prefix, with KV caches for compiled HTML. The note editor (`/note/[...slug]`) reads and updates R2 directly; the API endpoints (`/api/notes`) manage creation and deletion.
- Local development keeps D1, KV, and R2 state under `apps/memos/.wrangler/state`. The production bucket name remains in Wrangler configuration, but local development does not connect to it.
- `apps/memos/wrangler.jsonc` currently includes concrete IDs and a production URL. Keep it aligned with `apps/memos/void.json` and `apps/memos/src/app.d.ts`, and avoid mixing environments in one config unless you add explicit environment sections.
