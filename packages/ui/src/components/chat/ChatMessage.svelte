<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";
  import Avatar from "../Avatar.svelte";
  import ThinkingIndicator from "./ThinkingIndicator.svelte";

  export type ChatRole = "user" | "assistant" | "system";

  export interface ChatMessageProps extends HTMLAttributes<HTMLDivElement> {
    role: ChatRole;
    content?: string;
    avatarFallback?: string;
    avatarSrc?: string | null;
    timestamp?: string;
    typing?: boolean;
    children?: Snippet;
  }

  let {
    role,
    content,
    avatarFallback,
    avatarSrc,
    timestamp,
    typing = false,
    class: extraClass = "",
    children,
    ...rest
  }: ChatMessageProps = $props();

  const isUser = $derived(role === "user");
  const isSystem = $derived(role === "system");
</script>

{#if isSystem}
  <div class={cn("flex justify-center px-4 py-1", extraClass)} role="note" {...rest}>
    <span class="system-label">{content}</span>
  </div>
{:else if isUser}
  <div class={cn("flex flex-row-reverse items-start gap-2.5 px-4 py-2", extraClass)} {...rest}>
    <Avatar src={avatarSrc} fallback={avatarFallback ?? "U"} size="sm" class="shrink-0 mt-0.5" />
    <div class="flex flex-col gap-1 items-end max-w-[72%]">
      <div class="bubble bubble-user">
        {#if children}
          {@render children()}
        {:else}
          <span class="bubble-text">{content}</span>
        {/if}
      </div>
      {#if timestamp}
        <span class="timestamp">{timestamp}</span>
      {/if}
    </div>
  </div>
{:else}
  <div class={cn("flex flex-row items-start gap-2.5 px-4 py-2", extraClass)} {...rest}>
    <Avatar src={avatarSrc} fallback={avatarFallback ?? "AI"} size="sm" class="shrink-0 mt-0.5" />
    <div class="flex flex-col gap-1 items-start min-w-0 flex-1">
      <div class="assistant-body">
        {#if typing}
          <ThinkingIndicator />
        {:else if children}
          {@render children()}
        {:else}
          <span class="bubble-text">{content}</span>
        {/if}
      </div>
      {#if timestamp}
        <span class="timestamp">{timestamp}</span>
      {/if}
    </div>
  </div>
{/if}

<style>
  .bubble {
    display: inline-block;
    padding: 9px 13px;
    border-radius: var(--radius-xl);
    font-size: 13.5px;
    line-height: 1.55;
    word-break: break-word;
  }

  .bubble-user {
    background: var(--color-accent);
    color: var(--color-accent-foreground);
    border-bottom-right-radius: var(--radius-xs);
  }

  .assistant-body {
    font-size: 13.5px;
    line-height: 1.65;
    color: var(--color-foreground);
    word-break: break-word;
    width: 100%;
    padding-top: 2px;
  }

  .bubble-text {
    white-space: pre-wrap;
  }

  .timestamp {
    font-size: 11px;
    color: var(--color-muted-foreground);
    font-family: var(--font-mono);
    padding: 0 4px;
  }

  .system-label {
    font-size: 11.5px;
    color: var(--color-muted-foreground);
    font-family: var(--font-sans);
    background: var(--color-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    padding: 3px 12px;
  }
</style>
