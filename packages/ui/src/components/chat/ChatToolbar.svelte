<script lang="ts">
  import { onDestroy } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "../../lib/utils";
  import Button from "../Button.svelte";
  import { Copy, Check, RotateCw } from "@lucide/svelte";

  export interface ChatToolbarProps extends HTMLAttributes<HTMLDivElement> {
    content: string;
    onretry: () => void;
  }

  let { content, onretry, class: extraClass = "", ...rest }: ChatToolbarProps = $props();

  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | null = null;

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    copied = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copied = false;
      copyTimer = null;
    }, 2000);
  }

  onDestroy(() => {
    if (copyTimer) clearTimeout(copyTimer);
  });
</script>

<div class={cn("chat-toolbar", extraClass)} {...rest}>
  <Button
    variant="ghost"
    size="icon"
    class="toolbar-btn"
    aria-label={copied ? "Copied" : "Copy message"}
    onclick={handleCopy}
  >
    {#if copied}
      <Check size={14} />
    {:else}
      <Copy size={14} />
    {/if}
  </Button>

  {#if onretry}
    <Button variant="ghost" size="icon" class="toolbar-btn" aria-label="Retry" onclick={onretry}>
      <RotateCw size={14} />
    </Button>
  {/if}
</div>

<style>
  .chat-toolbar {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  :global(.toolbar-btn) {
    height: 28px;
    width: 28px;
    border-radius: var(--radius-sm);
    color: var(--color-muted-foreground);
  }

  :global(.toolbar-btn):hover {
    color: var(--color-foreground);
    background: var(--color-muted);
  }
</style>
