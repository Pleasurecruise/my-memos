<script lang="ts">
  import { ChatThread, ChatMessage, ChatInput } from "@my-memos/ui";
  import { Chat } from "$lib/chat/chat.svelte";
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import MarkdownContent from "$lib/components/MarkdownContent.svelte";
  import MemoSearchResults from "$lib/components/chat/MemoSearchResults.svelte";
  import { VisualCard } from "$lib/components/visual";

  interface Props {
    user: { image?: string | null | undefined; name: string } | null;
  }

  let { user }: Props = $props();

  const VISUAL_TOOLS = new Set(["render_chart", "render_svg", "render_mermaid", "render_widget"]);
  const TOOL_LABELS: Record<string, string> = {
    get_tags: "Fetching tags…",
    list_memos: "Browsing memos…",
    search_memos: "Searching memos…",
    create_memo: "Creating memo…",
    update_memo: "Updating memo…",
    delete_memo: "Deleting memo…",
    web_search: "Searching the web…",
    fetch_raw: "Fetching content…",
    fetch_url: "Reading page…",
    github_read: "Reading GitHub…",
    lookup_docs: "Looking up docs…",
  };

  const chat = new Chat();
  const isStreaming = $derived(chat.status === "submitted" || chat.status === "streaming");

  async function handleSend(text: string) {
    if (isStreaming) return;
    await chat.sendMessage(text);
  }
</script>

<AppShell>
  <div class="chat-outer">
    <div class="chat-layout">
      {#if chat.messages.length === 0}
        <div class="chat-welcome">
          <p class="chat-welcome-text">喵？今天过的怎么样</p>
          <ChatInput class="chat-welcome-input" onsend={handleSend} />
        </div>
      {:else}
        <ChatThread class="chat-thread pt-8">
          {#each chat.messages as msg (msg.id)}
            {#if msg.role === "assistant"}
              <ChatMessage
                role="assistant"
                avatarSrc="/favicon.png"
                typing={isStreaming &&
                  msg === chat.messages[chat.messages.length - 1] &&
                  !msg.steps.at(-1)?.parts.length}
              >
                {#each msg.steps as step, stepIndex (stepIndex)}
                  {#each step.parts as part, partIndex (partIndex)}
                    {#if part.type === "text" && part.text.trim()}
                      <MarkdownContent content={part.text} class="bubble-md" />
                    {:else if part.type === "tool"}
                      {@const toolName = part.toolName}
                      {#if toolName === "search_memos" && part.state === "output-available"}
                        <MemoSearchResults output={part.output} />
                      {:else if VISUAL_TOOLS.has(toolName) && part.state !== "output-error"}
                        <VisualCard {part} streaming={part.state !== "output-available"} />
                      {:else if part.state !== "output-available"}
                        <p class="tool-status">
                          {part.state === "output-error"
                            ? `${toolName}: ${part.errorText}`
                            : (TOOL_LABELS[toolName] ?? `${toolName}…`)}
                        </p>
                      {/if}
                    {/if}
                  {/each}
                {/each}
              </ChatMessage>
            {:else}
              <ChatMessage role="user" avatarSrc={user?.image} avatarFallback={user?.name}>
                {#each msg.parts as part, index (index)}
                  {#if part.type === "text"}
                    <span class="user-text">{part.text}</span>
                  {/if}
                {/each}
              </ChatMessage>
            {/if}
          {/each}
          {#if isStreaming && chat.messages[chat.messages.length - 1]?.role !== "assistant"}
            <ChatMessage role="assistant" avatarSrc="/favicon.png" typing />
          {/if}
        </ChatThread>

        {#if chat.error}
          <p class="chat-error">Error: {chat.error.message}</p>
        {/if}

        <div class="chat-input-wrap">
          <ChatInput onsend={handleSend} disabled={isStreaming} />
        </div>
      {/if}
    </div>
  </div>
</AppShell>

<style>
  .chat-outer {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .chat-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 720px;
    width: 100%;
    margin: 0 auto;
    padding: 0 1rem;
    position: relative;
  }
  .chat-welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1.5rem;
  }
  .chat-welcome-text {
    font-size: 1.125rem;
    color: var(--color-muted-foreground);
  }
  :global(.chat-welcome-input) {
    width: 100%;
  }
  :global(.chat-thread) {
    flex: 1;
    overflow-y: auto;
  }
  .chat-input-wrap {
    padding: 1rem 0;
    flex-shrink: 0;
  }
  .tool-status,
  .chat-error {
    font-size: 0.875rem;
    color: var(--color-muted-foreground);
    margin: 0;
  }
  .user-text {
    white-space: pre-wrap;
  }
</style>
