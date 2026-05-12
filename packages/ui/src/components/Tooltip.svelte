<script module lang="ts">
  import type { Snippet } from "svelte";

  export type TooltipSide = "top" | "bottom" | "left" | "right";

  export interface TooltipProps {
    content: string;
    side?: TooltipSide;
    delay?: number;
    children: Snippet;
    class?: string;
  }
</script>

<script lang="ts">
  import { cn } from "../lib/utils";
  import { fade } from "svelte/transition";

  let {
    content,
    side = "top",
    delay = 300,
    children,
    class: extraClass = "",
  }: TooltipProps = $props();

  let visible = $state(false);
  let timer: ReturnType<typeof setTimeout>;

  function show() {
    clearTimeout(timer);
    timer = setTimeout(() => (visible = true), delay);
  }

  function hide() {
    clearTimeout(timer);
    visible = false;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class={cn("relative inline-flex", extraClass)}
  onmouseenter={show}
  onmouseleave={hide}
  onfocusin={show}
  onfocusout={hide}
>
  {@render children()}

  {#if visible && content}
    <div
      role="tooltip"
      class={cn(
        "absolute z-50 rounded-md px-2.5 py-1.5",
        "bg-foreground text-background text-xs font-sans whitespace-nowrap",
        "pointer-events-none shadow-sm",
        side === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
        side === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-1.5",
        side === "left" && "right-full top-1/2 -translate-y-1/2 mr-1.5",
        side === "right" && "left-full top-1/2 -translate-y-1/2 ml-1.5",
      )}
      transition:fade={{ duration: 100 }}
    >
      {content}
    </div>
  {/if}
</div>
