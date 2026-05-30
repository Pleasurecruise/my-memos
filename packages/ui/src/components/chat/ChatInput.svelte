<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "../../lib/utils";
  import Button from "../Button.svelte";
  import { ArrowUp } from "@lucide/svelte";

  export interface ChatInputProps extends HTMLAttributes<HTMLDivElement> {
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    maxRows?: number;
    onsend?: (value: string) => void;
  }

  let {
    value = $bindable(""),
    placeholder = "Message…",
    disabled = false,
    maxRows = 6,
    onsend,
    class: extraClass = "",
    ...rest
  }: ChatInputProps = $props();

  let el = $state<HTMLTextAreaElement | undefined>(undefined);
  let lineHeight = 22;

  function resize() {
    if (!el) return;
    el.style.height = "auto";
    const maxH = lineHeight * maxRows + 16;
    el.style.height = Math.min(el.scrollHeight, maxH) + "px";
    el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onsend?.(trimmed);
    value = "";
    if (el) {
      el.style.height = "auto";
      el.style.overflowY = "hidden";
    }
  }

  const canSend = $derived(value.trim().length > 0 && !disabled);
</script>

<div class={cn("chat-input-root", extraClass)} {...rest}>
  <textarea
    bind:this={el}
    bind:value
    {placeholder}
    {disabled}
    rows={1}
    class="chat-textarea"
    aria-label={placeholder}
    oninput={resize}
    onkeydown={handleKeydown}
  ></textarea>
  <Button
    size="icon"
    variant={canSend ? "default" : "ghost"}
    disabled={!canSend}
    onclick={submit}
    aria-label="Send"
    class="send-btn"
  >
    <ArrowUp size={16} />
  </Button>
</div>

<style>
  .chat-input-root {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 10px 12px;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    transition: border-color var(--duration-fast);
  }

  .chat-input-root:focus-within {
    border-color: var(--color-accent);
  }

  .chat-textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    overflow: hidden;
    font-family: var(--font-sans);
    font-size: 13.5px;
    line-height: 22px;
    color: var(--color-foreground);
    min-height: 22px;
    padding: 0;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }

  .chat-textarea::placeholder {
    color: var(--color-muted-foreground);
  }

  .chat-textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :global(.send-btn) {
    flex-shrink: 0;
    margin-bottom: 0;
  }
</style>
