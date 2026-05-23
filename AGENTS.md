# AGENTS

This file is the entrypoint for agents and maintainers working in this repository.

## Project Summary

`my-memos` is a `pnpm` workspace centered on a SvelteKit memo application deployed to Cloudflare Workers. The main app lives in [apps/memos](/Users/pleasure1234/Github/my-memos/apps/memos), and the shared component/theme package lives in [packages/ui](/Users/pleasure1234/Github/my-memos/packages/ui).

## Read These First

- Architecture: [docs/ARCHITECTURE.md](/Users/pleasure1234/Github/my-memos/docs/ARCHITECTURE.md:1)
- Deployment guide: [docs/DEPLOYMENT.md](/Users/pleasure1234/Github/my-memos/docs/DEPLOYMENT.md:1)
- Design system and tokens: [docs/DESIGN.md](/Users/pleasure1234/Github/my-memos/docs/DESIGN.md:1)
- Code style guide: [docs/STYLEGUIDE.md](/Users/pleasure1234/Github/my-memos/docs/STYLEGUIDE.md:1)

## Working Expectations

- Prefer root-level commands from [package.json](/Users/pleasure1234/Github/my-memos/package.json:1).
- Run `pnpm` commands that touch the registry or run project checks outside the sandbox with approval to avoid sandbox-related hangs and timeouts.
- Keep Cloudflare binding changes synchronized across [wrangler.toml](/Users/pleasure1234/Github/my-memos/wrangler.toml:1), [apps/memos/src/app.d.ts](/Users/pleasure1234/Github/my-memos/apps/memos/src/app.d.ts:1), and the docs above.
- Treat `D1` as metadata storage, `R2` as memo body storage, and `KV` as cache only.
- Reuse `packages/ui` for generic UI primitives; keep route-specific composition in `apps/memos`.
- Do not overwrite or revert unrelated local changes unless explicitly asked.

## Change Checklist

Before finishing a non-trivial change:

1. Run `pnpm check`.
2. If deployment/runtime behavior changed, update [docs/DEPLOYMENT.md](/Users/pleasure1234/Github/my-memos/docs/DEPLOYMENT.md:1).
3. If directory responsibilities, data flow, or bindings changed, update [docs/ARCHITECTURE.md](/Users/pleasure1234/Github/my-memos/docs/ARCHITECTURE.md:1).
4. If theme tokens or visual primitives changed, update [docs/DESIGN.md](/Users/pleasure1234/Github/my-memos/docs/DESIGN.md:1).
