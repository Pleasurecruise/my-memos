<script module lang="ts">
  export const title = "Chat";
</script>

<script lang="ts">
  import { ChatMessage, ChatThread, ChatInput, ChatToolbar } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "role",
      type: '"user" | "assistant" | "system"',
      description: "Controls bubble alignment, color, and avatar.",
    },
    {
      name: "content",
      type: "string",
      description: "Plain text content of the message.",
    },
    {
      name: "avatarFallback",
      type: "string",
      description: "Initials shown when no avatarSrc is provided.",
    },
    {
      name: "avatarSrc",
      type: "string",
      description: "Optional avatar image URL.",
    },
    {
      name: "timestamp",
      type: "string",
      description: "Optional timestamp string rendered below the bubble.",
    },
    {
      name: "typing",
      type: "boolean",
      default: "false",
      description: "Shows a spinner instead of content.",
    },
    {
      name: "children",
      type: "Snippet",
      description: "Override bubble content with custom markup.",
    },
  ];

  const usage = `import { ChatMessage, ChatThread, ChatInput } from "@my-memos/ui";

// Full chat UI
<div style="display:flex; flex-direction:column; height:480px;">
  <ChatThread style="flex:1">
    <ChatMessage role="assistant" content="How can I help you?" />
    <ChatMessage role="user" content="Tell me a joke." />
    <ChatMessage role="assistant" typing />
  </ChatThread>
  <ChatInput onsend={(v) => console.log(v)} />
</div>`;

  // Interactive demo state
  let messages = $state([
    { id: 1, role: "assistant" as const, content: "你好！有什么我可以帮你的吗？", time: "09:00" },
    { id: 2, role: "user" as const, content: "帮我写一首关于秋天的短诗。", time: "09:01" },
    {
      id: 3,
      role: "assistant" as const,
      content: "落叶铺金径，\n秋风送凉意。\n枫红映斜阳，\n静默诉离绪。",
      time: "09:01",
    },
  ]);
  let isTyping = $state(false);
  let nextId = $state(4);

  function handleSend(value: string) {
    messages = [...messages, { id: nextId++, role: "user", content: value, time: now() }];
    isTyping = true;
    setTimeout(() => {
      messages = [
        ...messages,
        {
          id: nextId++,
          role: "assistant",
          content: "这是一条模拟回复，实际场景中这里会接入 AI 接口。",
          time: now(),
        },
      ];
      isTyping = false;
    }, 1800);
  }

  function now() {
    return new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }
</script>

<DemoPage {propDefs} {usage}>
  <!-- ChatMessage variants -->
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Message Roles</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <ChatMessage role="system" content="对话开始于 09:00" />
      <ChatMessage
        role="assistant"
        content="你好！我是 AI 助手，有什么可以帮你的？"
        avatarFallback="AI"
        timestamp="09:00"
      />
      <ChatMessage
        role="user"
        content="请介绍一下 Svelte 5 的 Runes 特性。"
        avatarFallback="U"
        timestamp="09:01"
      />
    </div>
  </section>

  <!-- ChatToolbar -->
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>ChatToolbar — hover for actions</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <ChatMessage
        role="assistant"
        content="试试鼠标悬停在这条消息上，会出现复制和重试按钮。"
        avatarFallback="AI"
      />
      <div class="toolbar-row">
        <ChatToolbar
          content="试试鼠标悬停在这条消息上，会出现复制和重试按钮。"
          onretry={() => alert("Retry clicked!")}
        />
      </div>
    </div>
  </section>

  <!-- Typing indicator -->
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Typing State</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <ChatMessage role="user" content="你在想什么？" avatarFallback="U" />
      <ChatMessage role="assistant" typing avatarFallback="AI" />
    </div>
  </section>

  <!-- ChatInput -->
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>ChatInput</SectionLabel>
    <div style="max-width: 520px; display: flex; flex-direction: column; gap: 8px;">
      <ChatInput placeholder="输入消息，Enter 发送…" onsend={(v) => alert(`Sent: ${v}`)} />
      <ChatInput placeholder="Disabled 状态" disabled />
    </div>
  </section>

  <!-- Full interactive demo -->
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Interactive Demo</SectionLabel>
    <div
      style="
        display: flex;
        flex-direction: column;
        height: 400px;
        max-width: 520px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-xl);
        overflow: hidden;
        background: var(--color-background);
      "
    >
      <ChatThread style="flex: 1; min-height: 0;">
        {#each messages as msg (msg.id)}
          <ChatMessage role={msg.role} content={msg.content} timestamp={msg.time} />
        {/each}
        {#if isTyping}
          <ChatMessage role="assistant" typing />
        {/if}
      </ChatThread>
      <div style="padding: 10px; border-top: 1px solid var(--color-border);">
        <ChatInput placeholder="发送消息…" disabled={isTyping} onsend={handleSend} />
      </div>
    </div>
  </section>
</DemoPage>
