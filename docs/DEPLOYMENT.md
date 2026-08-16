# Deployment

This repository is deployed as a Cloudflare Worker backed by D1, KV, and R2.

The deploy target is defined in [apps/memos/wrangler.json](../apps/memos/wrangler.json). Void's framework integration is configured beside it in [apps/memos/void.json](../apps/memos/void.json). The runnable app is the SvelteKit project in [apps/memos](../apps/memos), built to Cloudflare output and served by the generated SvelteKit Worker entry.

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

| Binding        | Type   | Purpose                                             |
| -------------- | ------ | --------------------------------------------------- |
| `DB`           | D1     | Memo metadata and Better Auth tables                |
| `MEMOS_CACHE`  | KV     | Tag, note, OG/font, and memory-deduplication caches |
| `MEMOS_BUCKET` | R2     | Memo bodies, long-form notes, prompts, and memory   |
| `ASSETS`       | Assets | Built SvelteKit client assets                       |

Current binding names and IDs live in [apps/memos/wrangler.json](../apps/memos/wrangler.json). Runtime TypeScript declarations live in [apps/memos/src/app.d.ts](../apps/memos/src/app.d.ts). Void is used for framework build and deployment integration, while Wrangler remains the source of truth for the existing D1, KV, and R2 bindings.

## Required Environment Variables

`App.Platform.env` is declared in [apps/memos/src/app.d.ts](../apps/memos/src/app.d.ts). In practice, this app needs:

| Variable               | Required              | Purpose                                             |
| ---------------------- | --------------------- | --------------------------------------------------- |
| `BETTER_AUTH_URL`      | yes                   | Public base URL used by Better Auth                 |
| `BETTER_AUTH_SECRET`   | yes                   | Better Auth signing secret                          |
| `GOOGLE_CLIENT_ID`     | yes                   | Google OAuth client ID                              |
| `GOOGLE_CLIENT_SECRET` | yes                   | Google OAuth client secret                          |
| `ALLOWED_EMAIL`        | yes in current config | Limits account creation to one allowed email        |
| `CF_ACCOUNT_ID`        | yes for chat          | Cloudflare account containing the AI Gateway        |
| `CF_AIG_TOKEN`         | yes for chat          | Authenticates the Gateway; it is not a provider key |
| `MCP_API_KEY`          | yes for MCP           | Fixed Bearer key for external MCP clients           |
| `TAVILY_API_KEY`       | yes for chat          | Tavily API key for web search                       |

Local development uses [apps/memos/.env.example](../apps/memos/.env.example) as the template. Copy it to `apps/memos/.env.local`; Void and Vite load it from the application package during development. Production builds switch Vite's `envDir` to `.void/build-env`, so local secrets are not copied into Worker vars. Production secrets should be managed with Wrangler secrets and environment vars, not committed files.

## Build And Deployment Flow

From repository root:

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm deploy
```

What each step does:

- `pnpm build`
  Builds `@my-memos/app` and writes Cloudflare output to `apps/memos/.svelte-kit/cloudflare`.
- `pnpm deploy`
  Runs `void deploy` from the `@my-memos/app` workspace, builds the SvelteKit framework target, and uploads its Worker and assets using the app-local configuration.

`pnpm d1:migrate:remote` is not a routine code-deployment step. Run it before deployment only for the first installation or when the change actually includes a new numbered SQL migration. Query-only changes do not require a migration.

Secret changes are a separate operation, not part of every code deployment. `wrangler secret put <NAME>` creates and immediately deploys a new Worker version. To prepare a secret without changing live traffic, use `wrangler versions secret put <NAME>` and deploy that version later with the code/configuration version you intend to release. `apps/memos/wrangler.json` is the source of truth for non-secret bindings and required secret names.

Chat uses the custom-provider `gateway.ai.cloudflare.com/v1/{account}/default/custom-opencode/v1` endpoint with `deepseek-v4-pro`. Configure the `custom-opencode` provider with an upstream base URL that resolves `/v1/chat/completions`, then store its API key under the `default` Gateway's Provider Keys with the `default` alias. The Worker sends only `cf-aig-authorization`; Cloudflare injects the stored provider key, so these calls use provider BYOK rather than Unified Billing. The deprecated `/compat/chat/completions` endpoint and the Unified Billing REST endpoint are not used.

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
  Starts the app workspace with `vp dev`; `voidPlugin()` proxies D1, KV, and R2 calls to the configured remote Cloudflare resources because each binding has `remote: true`. Local development can therefore read and mutate production data.
- `pnpm d1:migrate:local`
  Applies D1 migrations to app-local state under `apps/memos/.wrangler/state`. This explicit local command does not migrate the remote D1 database used by `pnpm dev`.
- `pnpm lint`
  Runs oxlint across the workspace.
- `pnpm format`
  Formats source files with oxfmt.
- `pnpm check`
  Runs format check, lint, and type checking.

## Data And Auth Migration Notes

The app relies on two migration groups:

- [apps/memos/migrations/0001_create_memos.sql](../apps/memos/migrations/0001_create_memos.sql)
  Creates the `memos` table and indexes.
- [apps/memos/migrations/0002_auth_tables.sql](../apps/memos/migrations/0002_auth_tables.sql)
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
  Public/auth-aware paginated GET; authenticated POST creates a memo.
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

- R2 is canonical for memo bodies. The current D1 `excerpt` field mirrors the trimmed body for list rendering and search. Memo lists are paginated from D1; KV contains only disposable caches and deduplication markers, so deleting KV entries must not lose source data.
- The chat route reads `agent/PROMPT.md` and `agent/MEMORY.md` from `MEMOS_BUCKET`. Missing files degrade gracefully, but chat behavior will change.
- Successful chats schedule memory maintenance with `waitUntil`; failures and R2 ETag conflicts never fail the already completed chat response.
- A live MCP key rotation with `wrangler secret put MCP_API_KEY` immediately creates and deploys a Worker version; use `wrangler versions secret put MCP_API_KEY` when preparing an undeployed version. There are no token-management routes or D1 token records.
- Long-form notes live in R2 under the `blog/` prefix, with KV caches for compiled HTML. Note page loaders and API endpoints call the shared `notes` service instead of accessing R2 or KV directly.
- Local development uses remote bindings for D1, KV, and R2 and can mutate the configured Cloudflare resources. The explicit `pnpm d1:migrate:local` command still targets app-local state under `apps/memos/.wrangler/state`.
- `apps/memos/wrangler.json` currently includes concrete IDs and a production URL. Keep it aligned with `apps/memos/void.json` and `apps/memos/src/app.d.ts`, and avoid mixing environments in one config unless you add explicit environment sections.
