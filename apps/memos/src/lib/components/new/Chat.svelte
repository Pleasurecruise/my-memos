<script lang="ts">
  import { ChatThread, ChatMessage, ChatInput } from "@my-memos/ui";
  import MarkdownContent from "$lib/components/MarkdownContent.svelte";
  import Masthead from "./Masthead.svelte";

  interface Props {
    user: { image?: string | null | undefined; name: string } | null;
  }

  let { user }: Props = $props();

  const TOOL_LABELS: Record<string, string> = {
    get_tags: "Fetching tags...",
    list_memos: "Browsing memos...",
    search_memos: "Searching memos...",
    update_memory: "Updating memory...",
  };

  interface Message {
    role: "user" | "assistant";
    content: string;
    thinking: boolean;
    toolStatus?: string;
  }

  let messages = $state<Message[]>([]);
  let isStreaming = $state(false);

  async function handleSend(text: string) {
    if (isStreaming) return;

    messages.push({ role: "user", content: text, thinking: false });

    const outgoing = messages.map((m) => ({ role: m.role, content: m.content }));

    isStreaming = true;
    messages.push({ role: "assistant", content: "", thinking: true });
    const assistantIdx = messages.length - 1;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: outgoing }),
      });

      if (!res.ok || !res.body) {
        messages[assistantIdx].thinking = false;
        messages[assistantIdx].content = "Error: failed to connect.";
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });

        const lines = buf.split("\n\n");
        buf = lines.pop()!;

        let finished = false;
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") {
            finished = true;
            break;
          }
          const parsed = JSON.parse(payload) as {
            text?: string;
            error?: string;
            tool_call?: string;
          };
          if (typeof parsed.error === "string") {
            messages[assistantIdx].thinking = false;
            messages[assistantIdx].toolStatus = undefined;
            messages[assistantIdx].content = `Error: ${parsed.error}`;
            finished = true;
            break;
          }
          if (typeof parsed.tool_call === "string") {
            messages[assistantIdx].toolStatus = TOOL_LABELS[parsed.tool_call];
          }
          if (typeof parsed.text === "string") {
            messages[assistantIdx].thinking = false;
            messages[assistantIdx].toolStatus = undefined;
            messages[assistantIdx].content += parsed.text;
          }
        }
        if (finished) break;
      }
    } finally {
      messages[assistantIdx].thinking = false;
      isStreaming = false;
    }
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
      {#if messages.length === 0}
        <div class="flex-1 flex items-center justify-center">
          <p class="font-serif italic text-lg text-muted-foreground">喵？今天过的怎么样</p>
        </div>
      {:else}
        <ChatThread class="flex-1 min-h-0 overflow-y-auto" style="padding-top: 16px">
          {#each messages as msg (msg)}
            {#if msg.role === "assistant"}
              <ChatMessage role="assistant" avatarSrc="/favicon.png" typing={msg.thinking}>
                {#if msg.toolStatus}
                  <p class="text-sm text-muted-foreground italic">{msg.toolStatus}</p>
                {:else if !msg.thinking}
                  <MarkdownContent content={msg.content} class="bubble-md" />
                {/if}
              </ChatMessage>
            {:else}
              <ChatMessage
                role="user"
                content={msg.content}
                avatarSrc={user?.image}
                avatarFallback={user?.name}
              />
            {/if}
          {/each}
        </ChatThread>
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
