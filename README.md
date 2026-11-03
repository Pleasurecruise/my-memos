# my-memos

A personal memo app built with SvelteKit, deployed as a Cloudflare Worker.

- **Storage** — D1 for memo indexes and searchable body mirrors, R2 for canonical markdown, and KV for disposable caches
- **Auth** — sign-in through the you-find.me OAuth gateway (Better Auth `genericOAuth`); only the account bound to the gateway owner (`sub` `owner`) can sign in
- **AI chat** — Cloudflare AI Gateway with memo-aware tools (list, search, create, update, delete)
- **Stack** — SvelteKit · Drizzle ORM · pnpm workspace · adapter-cloudflare

See [`docs/`](docs/) for architecture, deployment, and design system details.

## MCP client

Connect a Streamable HTTP MCP client to the public endpoint. The client discovers the you-find.me
authorization server from `/.well-known/oauth-protected-resource`, registers itself, and signs the
owner in through OAuth:

```json
{
  "mcpServers": {
    "my-memos": {
      "type": "streamable-http",
      "url": "https://memos.you-find.me/api/mcp"
    }
  }
}
```

Access tokens must carry the `https://memos.you-find.me` audience and the `memos:write` scope. The
endpoint supports MCP `2026-07-28` and stateless `2025-11-25` clients. It does not issue an
`Mcp-Session-Id`.

## License

AGPL-3.0

## References

- [Memos](https://github.com/usememos/memos) — Timeline-first product direction, Markdown-native capture, and deliberately simple note workflows
- [camelAI](https://github.com/qaml-ai/camelAI) — Cloudflare deployment and application/runtime boundaries
- [oh-my-pi](https://github.com/can1357/oh-my-pi) — pi package boundaries, streaming events, and tool harness design
