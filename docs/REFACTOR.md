# Minimal Agent Runtime Refactor

## Current design

The production chat runtime is intentionally stateless and has three boundaries:

```text
browser Svelte Chat store (page memory only)
  -> POST /api/chat (complete current-page messages)
  -> typed NDJSON agent events
  -> @my-memos/ai-core / pi Agent
  -> automatically negotiated stateless MCP
  -> app domain operations
```

`@my-memos/ai-core` owns pi Agent construction, the OpenAI-compatible model contract, MCP discovery, MCP-to-pi tool adaptation, cancellation, and runtime events. It does not import application or Cloudflare types. `@earendil-works/pi-agent-core` and `@earendil-works/pi-ai` are pinned together at `0.83.0`.

The application owns authentication, a small typed NDJSON chat bridge, R2 prompt/memory loading, the MCP server, and concrete D1/R2/KV operations. One browser assistant turn keeps the ordered pi steps around tool execution, which produces one visible message without losing protocol order. pi is the only server-side loop owner. Production has no Vercel AI SDK dependency.

## Deliberate omissions

There are no application limits for turns, tokens, tool calls, writes, provider cost, or elapsed runtime. A run ends when the model ends naturally, the request is cancelled, an upstream fails, or Cloudflare terminates execution.

There is also no Durable Object, thread ID, transcript store, snapshot, checkpoint, history API, resume, retry, or regenerate flow. Refreshing or leaving `/chat` discards the browser's current `Chat` instance. The server never persists input, output, or run state.

## Model

The model is `deepseek-chat` with pi's `openai-completions` API, sent to Cloudflare AI Gateway's provider-native DeepSeek base URL:

```text
https://gateway.ai.cloudflare.com/v1/{account}/default/deepseek
```

`CF_AIG_TOKEN` authenticates the Gateway through `cf-aig-authorization`. The app deliberately omits upstream `Authorization` and `x-api-key` headers so Cloudflare injects the provider key stored under AI Gateway BYOK. Provider-native and custom-provider routes remain supported; the deprecated `/compat/chat/completions` endpoint and Cloudflare Unified Billing REST endpoint are not used.

## MCP

`POST /api/mcp` is a single stateless endpoint created with the official v2 TypeScript SDK and `legacy: "stateless"`. The in-product client uses automatic version negotiation: it prefers the modern discovery flow and can fall back to the stateless `2025-11-25` initialize handshake. Session headers are rejected.

External clients send `Authorization: Bearer <MCP_API_KEY>`. The server hashes both the supplied and configured values with Web Crypto and compares the fixed-length digests. This one manually rotated key has access to every remotely exposed domain tool. There are no token CRUD routes, token tables, or scopes.

The in-product Agent uses the same handler through an in-process `fetch`, with a trusted in-product principal derived from Better Auth state. It does not expose or read the external key.

Externally exposed tool names are stable:

- `get_tags`, `list_memos`, `search_memos`
- `create_memo`, `update_memo`, `delete_memo`
- `web_search`, `fetch_raw`, `fetch_url`, `github_read`, `lookup_docs`

The in-product Agent additionally receives `render_chart`, `render_svg`, `render_mermaid`, and `render_widget` through its trusted Better Auth principal. Those tools describe page UI and are deliberately omitted from discovery and invocation for external API-key clients.

Domain operations contain the implementation and parse their schemas at their own boundary, even when invoked outside MCP. The MCP layer owns principal-based exposure, invocation, structured results, and structured error mapping. Mutation tools are sequential; read and in-product render tools may run in parallel. URL-reading tools reject non-public targets before fetching.

## Prompt and memory

`agent/PROMPT.md` and `agent/MEMORY.md` remain in R2. Reads use a 30-second cache with ETag revalidation instead of a never-invalidated process cache.

After a successful chat, the server passes only the newest user message and newly generated assistant text to `platform.ctx.waitUntil()`. A no-tool model call returns `{ changed, memory }`. It may keep explicit durable identity, preferences, work habits, long-running projects, corrections, and remember/forget instructions. It must exclude transient tasks, ordinary chat, raw tool output, unconfirmed assistant inferences, credentials, secrets, and sensitive data.

Unchanged memory is not written. Changed memory uses an R2 `onlyIf` ETag condition. On conflict the updater reads current memory and recomputes once; a second conflict or any background failure is logged without affecting chat. KV stores only a short-lived message-ID status marker for deduplication. The only durable chat-derived content is the consolidated `MEMORY.md`.

## Historical lightweight adapter

The following snapshot records the core implementation before refactoring on 2026-07-31. It is a technical archive, not a production fallback, and must remain in this document after the executable adapter is removed.

The original design was valuable because the complete loop was visible in one route, tools were ordinary functions with schemas, prompt and memory were Markdown in R2, and the browser used a mature UI stream. Its limitations came from growth: the browser owned the transcript, the route accumulated responsibilities, and tools were coupled to one SDK.

Original chat loop, from `apps/memos/src/routes/api/chat/+server.ts`:

```ts
const { messages: requestMessages } = (await request.json()) as { messages: UIMessage[] };
const { prompt: promptMd, memory: memoryMd } = await loadPromptMemory(platform.env.MEMOS_BUCKET);

const today = new Date().toISOString().slice(0, 10);
let system = `Today's date (UTC): ${today}\n\n${
  promptMd || "You are a helpful personal assistant."
}`;
if (memoryMd) system += `\n\n<memory>\n${memoryMd}\n</memory>`;
system += `\n\n${GENERATIVE_UI_PROMPT}`;

const result = streamText({
  model: createProvider(platform.env).chat("deepseek/deepseek-v4-flash"),
  system,
  messages: await convertToModelMessages(requestMessages),
  stopWhen: stepCountIs(20),
  tools: createChatTools(platform.env),
});

return result.toUIMessageStreamResponse({
  originalMessages: requestMessages,
  onError: (error) => (error instanceof Error ? error.message : String(error)),
});
```

Original model adapter, from `apps/memos/src/lib/server/chat/provider.ts`:

```ts
export function createProvider(env: ProviderEnv) {
  const gateway = createAiGateway({
    accountId: env.CF_ACCOUNT_ID,
    gateway: env.CF_GATEWAY_NAME,
    apiKey: env.CF_AIG_TOKEN,
  });
  const unified = createUnified();

  return {
    chat(modelId: string) {
      return gateway(unified(modelId));
    },
  };
}
```

Original tool composition, from `apps/memos/src/lib/server/chat/tools/index.ts`:

```ts
export function createChatTools(env: Env) {
  const db = drizzle(env.DB);

  return {
    ...createVisualTools(),
    ...createMemoReadTools({
      d1: env.DB,
      db,
      bucket: env.MEMOS_BUCKET,
      cache: env.MEMOS_CACHE,
    }),
    ...createMemoWriteTools({
      d1: env.DB,
      bucket: env.MEMOS_BUCKET,
      cache: env.MEMOS_CACHE,
    }),
    ...createWebSearchTool(env.TAVILY_API_KEY),
    ...createDefuddleTool(),
    ...createFetchRawTool(),
    ...createGitHubTool(),
    ...createContext7Tool(),
  };
}
```

Original memory write, from `apps/memos/src/lib/server/chat/auto-dream.ts`:

```ts
const prompt = buildPrompt(currentMemory, messages);
const { text } = await generateText({ model, prompt });

await bucket.put("agent/MEMORY.md", text.trim(), {
  httpMetadata: { contentType: "text/markdown; charset=utf-8" },
});
```

The browser called a separate `/api/chat/consolidate` route when navigating away, and the toolbar exposed AI SDK regeneration. The implementation remains here because its compact adapter logic is useful technical context. Production does not keep a dual runtime or feature flag.

## Verification boundary

Local acceptance requires `pnpm check`, `pnpm test`, `pnpm build`, MCP discovery/call/auth/revision tests, cancellation tests, UI-stream tool card checks, and memory conflict/dedupe tests. Deployment acceptance additionally requires a real streamed tool-call against Cloudflare and an HTTP contract test against `/api/mcp`; those checks require deployed bindings and secrets and cannot be truthfully replaced by local mocks.
