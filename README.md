# my-memos

A personal memo app built with SvelteKit, deployed as a Cloudflare Worker.

- **Storage** — D1 for memo metadata, R2 for full markdown content, KV for derived caches
- **Auth** — Google OAuth via Better Auth; optional single-user gating with `ALLOWED_EMAIL`
- **AI chat** — Cloudflare AI Gateway with memo-aware tools (list, search, create, update, delete)
- **Stack** — SvelteKit · Drizzle ORM · pnpm workspace · adapter-cloudflare

See [`docs/`](docs/) for architecture, deployment, and design system details.

## License

AGPL-3.0
