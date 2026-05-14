<script lang="ts">
  import { ChatThread, ChatMessage, ChatInput } from "@my-memos/ui";
  import AppShell from "$lib/components/AppShell.svelte";
  import MarkdownContent from "$lib/components/MarkdownContent.svelte";
  import type { PageData } from "./$types";
  import "./chat.css";

  let { data }: { data: PageData } = $props();

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
        <ChatThread class="chat-thread" style="padding-top: 32px">
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
                avatarSrc={data.user.image}
                avatarFallback={data.user.name}
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
