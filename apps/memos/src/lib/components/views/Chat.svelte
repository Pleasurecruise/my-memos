<script lang="ts">
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import { Chat } from "@ai-sdk/svelte";
  import { getToolName, isToolUIPart } from "ai";
  import { beforeNavigate } from "$app/navigation";
  import {
    ChatThread,
    ChatMessage,
    ChatInput,
    ChatToolbar,
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from "@my-memos/ui";
  import MarkdownContent from "$lib/components/MarkdownContent.svelte";
  import { VisualCard } from "$lib/components/visual";
  import Masthead from "$lib/components/layout/Masthead.svelte";

  const VISUAL_TOOLS = new Set(["render_chart", "render_svg", "render_mermaid", "render_widget"]);

  interface Props {
    user: { image?: string | null; name: string } | null;
  }

  let { user }: Props = $props();

  const chat = new Chat({
    onFinish: ({ message, messages }) => {
      console.debug('[Chat] onFinish', { messageParts: message.parts.length, totalMessages: messages.length });
    },
    onError: (error) => {
      console.error('[Chat] onError', error);
    },
  });
  const isStreaming = $derived(chat.status === "submitted" || chat.status === "streaming");

  beforeNavigate((nav) => {
    if (nav.from?.route?.id === "/chat" && chat.messages.length > 0) {
      fetch("/api/chat/consolidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chat.messages }),
      });
    }
  });

  async function handleSend(text: string) {
    if (isStreaming) return;
    await chat.sendMessage({ text });
  }
</script>

<div class="min-h-screen bg-background text-foreground font-sans flex flex-col">
  <div class="max-w-280 mx-auto px-4 sm:px-8 pt-7 w-full">
    <Masthead />
  </div>

  <!-- Chat body: heading pinned top, input pinned bottom, middle area swaps -->
  <div class="flex-1 flex flex-col max-w-180 mx-auto w-full px-4 sm:px-8">
    <div class="mb-6 pt-0 shrink-0">
      <div class="relative inline-block">
        <h1 class="font-serif font-semibold text-7 text-foreground leading-none">chat</h1>
        <span class="absolute left-0 -bottom-1.5 h-0.5 w-8 rounded-sm bg-accent"></span>
      </div>
      <p class="text-sm text-muted-foreground mt-4">Ask your memos.</p>
    </div>

    <!-- Content + input: flex-1 so input always sticks to bottom -->
    <div class="flex-1 flex flex-col min-h-0">
      {#if chat.messages.length === 0}
        <div class="flex-1 flex items-center justify-center">
          <p class="font-serif italic text-lg text-muted-foreground">喵？今天过的怎么样</p>
        </div>
      {:else}
        <ChatThread class="flex-1 min-h-0 overflow-y-auto pt-4">
          {#each chat.messages as msg (msg.id)}
            {#if msg.role === "assistant"}
              {@const msgText = msg.parts
                .filter((p): p is { type: "text"; text: string } => p.type === "text")
                .map((p) => p.text)
                .join("\n")
                .trim()}
              <ChatMessage
                role="assistant"
                avatarSrc="/favicon.png"
                typing={isStreaming &&
                  msg === chat.messages[chat.messages.length - 1] &&
                  !msg.parts.length}
              >
                {#if msg.parts.length}
                  <div class="flex flex-col gap-2">
                    {#each msg.parts as part, index (index)}
                      {#if isToolUIPart(part)}
                        {#if VISUAL_TOOLS.has(getToolName(part)) && part.state !== "output-error"}
                          <VisualCard {part} streaming={part.state !== "output-available"} />
                        {:else}
                          <Collapsible>
                            <CollapsibleTrigger
                              class="tool-trigger w-fit max-w-full rounded px-0.5 py-px font-mono text-xs leading-5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label={`Toggle ${getToolName(part)} tool details`}
                            >
                              <ChevronRight
                                size={14}
                                class="tool-chevron shrink-0 transition-transform duration-150"
                              />
                              <code class="text-foreground">{getToolName(part)}</code>
                              <span class="min-w-0 truncate">{part.state.replaceAll("-", " ")}</span
                              >
                            </CollapsibleTrigger>

                            <CollapsibleContent class="ml-5 mt-1 border-l border-border pl-3">
                              <div class="flex flex-col gap-2 pb-1">
                                {#if part.input && typeof part.input === "object" && !Array.isArray(part.input) && Object.keys(part.input).length}
                                  <div class="tool-detail">
                                    <span>arguments</span>
                                    <pre>{JSON.stringify(part.input, null, 2)}</pre>
                                  </div>
                                {/if}
                                {#if part.state === "output-available"}
                                  <div class="tool-detail">
                                    <span>result</span>
                                    <pre>{typeof part.output === "string"
                                        ? part.output
                                        : JSON.stringify(part.output, null, 2)}</pre>
                                  </div>
                                {:else if part.state === "output-error"}
                                  <div class="tool-detail">
                                    <span>error</span>
                                    <pre>{part.errorText}</pre>
                                  </div>
                                {/if}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        {/if}
                      {:else if part.type === "text" && part.text.trim()}
                        <MarkdownContent content={part.text} class="bubble-md" />
                      {/if}
                    {/each}
                  </div>
                {/if}
              </ChatMessage>
              {#if msgText && !isStreaming}
                <div class="toolbar-row">
                  <ChatToolbar
                    content={msgText}
                    onretry={() => chat.regenerate({ messageId: msg.id })}
                  />
                </div>
              {/if}
            {:else}
              <ChatMessage role="user" avatarSrc={user?.image} avatarFallback={user?.name}>
                {#each msg.parts as part, index (index)}
                  {#if part.type === "text"}
                    <span class="whitespace-pre-wrap">{part.text}</span>
                  {/if}
                {/each}
              </ChatMessage>
            {/if}
          {/each}
          {#if isStreaming && chat.messages[chat.messages.length - 1]?.role !== "assistant"}
            <ChatMessage role="assistant" avatarSrc="/favicon.png" typing />
          {/if}
        </ChatThread>
      {/if}

      {#if chat.error}
        <p class="mt-3 text-sm text-muted-foreground">Error: {chat.error.message}</p>
      {/if}

      <!-- Input: always at the bottom, no jump -->
      <div
        class="shrink-0 sticky bottom-0 pt-3 pb-6 mt-4 bg-linear-to-b from-transparent to-background"
      >
        <ChatInput onsend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  </div>
</div>

<style>
  .tool-detail {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .tool-detail span {
    font-family: var(--font-mono);
    font-size: 10.5px;
    line-height: 1.4;
    color: var(--color-muted-foreground);
    text-transform: uppercase;
  }

  .tool-detail pre {
    max-width: min(100%, 640px);
    max-height: 260px;
    margin: 0;
    overflow: auto;
    border-radius: 4px;
    background: var(--color-muted);
    padding: 8px 10px;
    font-family: var(--font-mono);
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--color-foreground);
    white-space: pre-wrap;
    word-break: break-word;
  }

  :global(.tool-trigger[data-state="open"] .tool-chevron) {
    transform: rotate(90deg);
  }

  .toolbar-row {
    display: flex;
    padding: 0 16px 6px 52px;
  }
</style>
