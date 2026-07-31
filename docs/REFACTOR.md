# Agent Runtime Refactor

## Purpose

The current chat implementation is a small agent adapter built directly on Vercel AI SDK.
It combines the model, prompt, memory, tools, loop limit, and UI stream in one SvelteKit route.

This refactor has three goals:

- extract a reusable `@my-memos/ai-core` monorepo package;
- replace the custom loop with pi-agent-core;
- expose the existing tools through an authenticated MCP server using protocol revision `2026-07-28`.

The project exists for personal learning and practice. The original lightweight implementation is therefore recorded at the end of this document instead of being erased from the architectural story.

## Architecture

```text
Browser / @ai-sdk/svelte Chat
  |
  v
SvelteKit application (@my-memos/app)
  |- authentication and browser stream adapter
  |- /api/mcp endpoint
  |- my-memos MCP server
  |- Cloudflare service implementations
  `- ChatThread Durable Object binding
          |
          v
    @my-memos/ai-core
      |- pi Agent lifecycle
      |- model interface
      |- MCP client
      |- MCP-tool-to-pi adapter
      |- context and run budgets
      `- runtime event stream
          |
          v
    Cloudflare AI Gateway -> DeepSeek V4 Flash

ChatThreadDO SQLite -> canonical transcript and run checkpoints
D1                  -> memo metadata, auth, optional thread index
R2                  -> memo bodies, PROMPT.md, MEMORY.md
KV                  -> derived memo caches only
```

The design follows one important idea from [camelAI](https://github.com/qaml-ai/camelAI): each chat thread has a Durable Object that owns its agent execution and persistent state. It does not copy camelAI's coding workspace, filesystem, sandbox containers, build system, or publishing platform.

Only the AI core becomes a new package. The MCP server remains inside the application.

That distinction is deliberate:

- AI core is independent of memos, SvelteKit, and Cloudflare storage, so it has a real reuse boundary.
- The MCP server exposes my-memos capabilities and depends on its authentication, repositories, bindings, and policies.
- Moving the MCP server into `packages/` would mostly relocate application code and introduce dependency injection without meaningful reuse.
- The protocol already provides the external boundary. Code does not also need a package boundary merely because it has an HTTP boundary.

The MCP server can be extracted later if a second application needs to host the same capabilities. Until then, keeping it near the domain follows the project's preference for small, concrete abstractions.

## Monorepo AI core

Create `packages/ai-core` with package name `@my-memos/ai-core`.

It owns:

- construction and operation of a pi `Agent`;
- canonical runtime events and run results;
- model/provider interfaces;
- MCP client connections and tool discovery;
- conversion of MCP tools into pi `AgentTool` objects;
- context transformation, cancellation, and run budgets;
- serializable runtime snapshots used by the Cloudflare host.

It must not import:

- SvelteKit or `App.Platform`;
- D1, R2, KV, or Durable Object bindings;
- Better Auth or memo repositories;
- Svelte components;
- Vercel AI SDK `UIMessage` types;
- pi coding-agent, TUI, filesystem tools, or Node SQLite adapters.

Suggested structure:

```text
packages/ai-core/
  package.json
  src/
    index.ts
    runtime.ts
    types.ts
    model.ts
    events.ts
    context.ts
    budget.ts
    mcp-client.ts
    mcp-tool-adapter.ts
```

Its public API should accept thread identity, system context, canonical messages, a model, MCP tool sources, run budgets, and cancellation. It should expose an async runtime event stream, abort and idle controls, and a serializable snapshot. Concrete Cloudflare types must stay outside this contract.

Use pi's high-level `Agent` first. It already provides event subscriptions, tool execution, abort, idle barriers, context transformation, steering, follow-up queues, and tool hooks. Use the lower-level `agentLoop()` only if a measured checkpoint requirement cannot be implemented through `Agent`.

Both `@earendil-works/pi-agent-core` and `@earendil-works/pi-ai` must be pinned to the same exact version. Upgrade them together in isolated changes.

Conceptually, the package creates the runtime like this:

```ts
const tools = await discoverMcpTools(toolSources);

const agent = new Agent({
  initialState: {
    systemPrompt,
    model,
    messages,
    tools: tools.map(toPiAgentTool),
  },
  streamFn,
  transformContext,
  beforeToolCall: enforceRunPolicy,
  afterToolCall: recordToolOutcome,
  sessionId: threadId,
  toolExecution: "parallel",
});
```

The MCP adapter propagates cancellation and deadlines, preserves tool-call IDs, converts structured results, maps progress to pi updates, redacts transport details, and marks mutation tools as sequential.

Replacing `stepCountIs(20)` must not remove the safety limit. The core needs explicit budgets for turns, tool calls, mutations, tokens, tool-result bytes, wall-clock duration, and provider cost.

## MCP server

Keep the server in the application:

```text
apps/memos/src/lib/server/mcp/
  server.ts
  auth.ts
  errors.ts
  tools/
    memos-read.ts
    memos-write.ts
    web-search.ts
    fetch.ts
    defuddle.ts
    github.ts
    context7.ts
    visual.ts

apps/memos/src/routes/api/mcp/+server.ts
```

The server owns tool names, descriptions, JSON Schemas, structured results, authorization policy, and mapping to existing domain operations. Concrete D1/R2/KV services remain in `apps/memos/src/lib/server`.

The pi runtime must call tools through an MCP client boundary. It must not import MCP tool implementations directly. The same capabilities can then be called by:

- the in-product pi agent;
- an external authorized MCP client;
- protocol conformance tests;
- future development or automation clients.

For the in-product agent, use an in-process `fetch` transport backed by the same MCP handler factory. This avoids a public network round trip while still exercising the actual MCP wire contract. A deployed HTTP contract test remains necessary because in-process tests cannot validate Cloudflare routing, headers, auth, or streaming.

The endpoint is:

```text
POST /api/mcp
```

The SvelteKit route authenticates the Better Auth session or a scoped machine token, derives the principal from trusted server state, validates the requested protocol version, and passes a request context to a fresh MCP handler.

The server explicitly targets MCP `2026-07-28`:

- the HTTP protocol core is stateless;
- modern connections do not use `initialize`, `notifications/initialized`, or `Mcp-Session-Id`;
- clients use `server/discover` for capability discovery;
- protocol and client information travel with each request;
- routing uses standard headers such as `MCP-Protocol-Version`, `Mcp-Method`, and `Mcp-Name`;
- cancellation closes the request stream;
- tool schemas use full JSON Schema 2020-12;
- `structuredContent` may be any JSON value;
- multi-round-trip results replace stateful server-to-client request flows.

Use the official TypeScript SDK v2 client/server packages and explicitly opt into the modern protocol era. Package versions alone do not prove compliance: tests must assert the negotiated or pinned revision and fail if the implementation silently falls back to a 2025 protocol.

References:

- [MCP 2026-07-28 release overview](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/)
- [Official TypeScript SDK migration guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration/support-2026-07-28.md)
- [Official TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

MCP is stateless, but the application is not. MCP request state belongs to one tool flow; chat state belongs to `ChatThreadDO`; personal memory belongs to R2; memo data belongs to D1 and R2. An MCP session identifier must never be repurposed as a chat thread identifier.

The existing capabilities retain their names during migration:

| Tools                                                           | Policy                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------- |
| `get_tags`, `list_memos`, `search_memos`                        | `memos:read`; parallel and bounded                      |
| `create_memo`, `update_memo`                                    | `memos:write`; sequential and idempotent                |
| `delete_memo`                                                   | `memos:delete`; independently authorized                |
| `web_search`, `fetch`, `defuddle`                               | `network:read`; URL, timeout, redirect, and size limits |
| `github`, `context7`                                            | `network:read`; credential and output redaction         |
| `render_chart`, `render_svg`, `render_mermaid`, `render_widget` | `visual:render`; structured and size-limited            |

Tool declarations should wrap typed domain operations rather than contain repository logic:

```text
domain operation
  -> typed input and injected dependencies
  -> typed domain result

MCP adapter
  -> authorization and JSON Schema validation
  -> domain call
  -> content and structuredContent
```

MCP becomes the sole agent-facing registry after cutover. Do not maintain both AI SDK and MCP declarations for the same operation.

The current tools sometimes return failure text as successful output. The MCP server should distinguish invalid input, not found, forbidden, conflict, timeout, upstream failure, and internal failure. Sensitive upstream errors stay in redacted server logs.

Authentication is not enough for private mutation tools. The server uses scopes, owner derivation, audit events, deadlines, bounded output, and idempotency keys derived from run and tool-call IDs. A prompt instruction to confirm deletion is useful behavior, but it is not a security boundary.

## Cloudflare host and state

Use one SQLite-backed `ChatThreadDO` per chat thread, not one per user. Even though the application is currently single-user, a thread boundary is needed for history, retries, parallel tabs, and future branching.

The Durable Object owns:

- serialization of runs for one thread;
- canonical pi messages;
- run metadata and checkpoints;
- idempotent input acceptance;
- retry, abort, history, and status operations;
- construction of `@my-memos/ai-core` for each run.

It does not own MCP sessions because the 2026-07-28 HTTP protocol is stateless. It also does not treat an in-memory `Agent` instance as durable; the agent is reconstructed from stored state after eviction.

Its SQLite schema needs a sequenced `messages` table and a `runs` table containing a
unique idempotency key, status, timestamps, and a safe error code. Add checkpoints only
when recovery tests demonstrate that message-level persistence is insufficient.

The browser may continue using `@ai-sdk/svelte` as a UI and streaming client while pi is the
only server-side agent runtime. The application converts pi runtime events into the existing
UI message stream. This bridge stays in the app because `@my-memos/ai-core` must not know
about `UIMessage`.

The model adapter should configure pi-ai for Cloudflare AI Gateway's OpenAI-compatible endpoint and `deepseek/deepseek-v4-flash`. Credentials are injected by the app. If streamed tool-call deltas are incompatible, implement a narrow pi `streamFn`; do not hide AI SDK `streamText()` inside it and create two loop owners.

Keep the existing data responsibilities:

- `agent/PROMPT.md` in R2 is the system persona;
- `agent/MEMORY.md` in R2 is long-term personal memory;
- thread transcripts belong to the DO;
- memo bodies remain in R2 with metadata in D1;
- KV remains derived cache only.

Replace the never-invalidated process cache with ETag/TTL-aware prompt loading. Run memory consolidation only after the transcript is committed. Consolidation failure must not fail a completed chat response, and concurrent global memory writes need conditional R2 updates or a coordinator DO.

Implementation requires synchronized changes to `wrangler.jsonc`, `app.d.ts`, `worker.ts`, `ARCHITECTURE.md`, and `DEPLOYMENT.md`. The Worker bundle must export `ChatThreadDO` in addition to the generated SvelteKit handler. The new namespace uses SQLite storage; confirm whether the current Wrangler/Void combination supports declarative `exports` before choosing it over legacy DO migrations.

## Migration

1. Preserve representative old-runtime conversations and metrics.
2. Create `packages/ai-core` with package tests and enforced dependency boundaries.
3. Build a minimal MCP 2026-07-28 compatibility spike with fake read and mutation tools.
4. Verify discovery, calls, cancellation, auth, structured output, Cloudflare builds, and real HTTP headers.
5. Extract domain operations from current AI SDK tools and expose every tool through `/api/mcp`.
6. Build and test the pi model and MCP-client adapters outside the production route.
7. Add `ChatThreadDO`, persistence, retry, abort, and history around the pi runtime.
8. Compare text, tool, error, visual, latency, and usage behavior against preserved fixtures.
9. Replace the production chat route with the pi-backed Durable Object implementation.
10. Move memory consolidation to the committed-run lifecycle.
11. Delete the executable legacy runtime after the pi route passes its acceptance tests.

Required tests cover MCP revision pinning, discovery, calls, schemas, auth, and errors;
pi event and result mapping; cancellation, budgets, and mutation serialization; Better Auth
principal mapping; DeepSeek streaming through AI Gateway; idempotent single-thread runs;
DO reconstruction; visual UI compatibility; and memory update conflicts.

The legacy runtime is not retained as a production fallback or feature-flagged mode. Its design
survives only in the historical section below and in git history. Before switching the route,
the pi implementation must pass the acceptance tests in an isolated test endpoint or worker.
After cutover, operational rollback means reverting the deployment, not maintaining two live
agent implementations. Keep transcript formats versioned and MCP tool names stable.

## Historical lightweight adapter

The following snapshot records the core implementation before refactoring on 2026-07-31.

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

The refactor should preserve this clarity where possible. A mature runtime and a standard protocol are useful only if the resulting boundaries remain understandable.

## Completion

The refactor is complete when:

- `@my-memos/ai-core` is reusable and has no app/platform imports;
- pi is the sole owner of the primary agent loop;
- every existing tool is available through authenticated MCP `2026-07-28`;
- pi discovers and invokes tools through MCP;
- external authorized MCP clients can call `/api/mcp`;
- each thread is serialized and persisted by a SQLite-backed Durable Object;
- Cloudflare AI Gateway, DeepSeek, prompt, memory, and visual behavior remain verified;
- budgets, authorization, idempotency, observability, and failure recovery are tested;
- architecture, deployment, bindings, and runtime types are synchronized;
- this historical record remains after the original adapter is removed.
