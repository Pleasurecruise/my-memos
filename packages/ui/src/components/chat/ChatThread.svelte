<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export interface ChatThreadProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
    autoscroll?: boolean;
  }
</script>

<script lang="ts">
  import { cn } from "../../lib/utils";
  import { tick } from "svelte";

  let { children, autoscroll = true, class: extraClass = "", ...rest }: ChatThreadProps = $props();

  let el = $state<HTMLDivElement | undefined>(undefined);
  let isAtBottom = $state(true);

  function checkBottom() {
    if (!el) return;
    const threshold = 40;
    isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }

  export async function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    await tick();
    el?.scrollTo({ top: el.scrollHeight, behavior });
  }

  $effect(() => {
    if (!autoscroll || !el || !isAtBottom) return;
    void children;
    scrollToBottom();
  });
</script>

<div bind:this={el} class={cn("thread", extraClass)} onscroll={checkBottom} {...rest}>
  {@render children?.()}
</div>

<style>
  .thread {
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    padding-block: 16px;
    scrollbar-width: none;
  }

  .thread::-webkit-scrollbar {
    display: none;
  }
</style>
