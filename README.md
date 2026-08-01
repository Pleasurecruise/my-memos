# my-memos

A personal memo app built with SvelteKit, deployed as a Cloudflare Worker.

- **Storage** — D1 for memo indexes and searchable body mirrors, R2 for canonical markdown, KV for disposable caches
- **Auth** — Google OAuth via Better Auth; optional single-user gating with `ALLOWED_EMAIL`
- **AI chat** — Cloudflare AI Gateway with memo-aware tools (list, search, create, update, delete)
- **Stack** — SvelteKit · Drizzle ORM · pnpm workspace · adapter-cloudflare

See [`docs/`](docs/) for architecture, deployment, and design system details.

## MCP client

Connect a Streamable HTTP MCP client to the public endpoint with the fixed API key:

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

Replace `${MCP_API_KEY}` with the configured secret, or use the client's environment-variable expansion when supported. The endpoint supports MCP `2026-07-28` and stateless `2025-11-25` clients. It does not issue an `Mcp-Session-Id`.

## License

AGPL-3.0

## References

- [Memos](https://github.com/usememos/memos) — Timeline-first product direction, Markdown-native capture, and deliberately simple note workflows
- [camelAI](https://github.com/qaml-ai/camelAI) — Cloudflare deployment and application/runtime boundaries
- [oh-my-pi](https://github.com/can1357/oh-my-pi) — pi package boundaries, streaming events, and tool harness design
