<script lang="ts">
  import { ChatThread, ChatMessage, ChatInput } from "@my-memos/ui";
  import { beforeNavigate } from "$app/navigation";
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import MarkdownContent from "$lib/components/MarkdownContent.svelte";

  interface Props {
    user: { image?: string | null | undefined; name: string } | null;
  }

  let { user }: Props = $props();

  const TOOL_LABELS: Record<string, string> = {
    get_tags: "正在获取标签…",
    list_memos: "正在浏览备忘录…",
    search_memos: "正在搜索备忘录…",
    update_memory: "正在更新记忆…",
  };

  interface Message {
    role: "user" | "assistant";
    content: string;
    thinking: boolean;
    toolStatus?: string;
  }

  let messages = $state<Message[]>([]);
  let isStreaming = $state(false);

  beforeNavigate((nav) => {
    if (nav.from?.route?.id === "/chat" && messages.length > 0) {
      fetch("/api/chat/consolidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            id: crypto.randomUUID(),
            role: m.role,
            parts: [{ type: "text", text: m.content }],
          })),
        }),
      });
    }
  });

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

<AppShell>
  <div class="chat-outer">
    <div class="chat-layout">
      {#if messages.length === 0}
        <div class="chat-welcome">
          <p class="chat-welcome-text">喵？今天过的怎么样</p>
          <ChatInput class="chat-welcome-input" onsend={handleSend} />
        </div>
      {:else}
        <ChatThread class="chat-thread pt-8">
          {#each messages as msg (msg)}
            {#if msg.role === "assistant"}
              <ChatMessage role="assistant" avatarSrc="/favicon.png" typing={msg.thinking}>
                {#if msg.toolStatus}
                  <p class="tool-status">{msg.toolStatus}</p>
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
  .tool-status {
    font-size: 0.875rem;
    color: var(--color-muted-foreground);
    margin: 0;
  }
</style>
