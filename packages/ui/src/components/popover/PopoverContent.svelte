<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export type PopoverSide = "top" | "bottom";
  export type PopoverAlign = "start" | "center" | "end";

  export interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {
    side?: PopoverSide;
    align?: PopoverAlign;
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { getContext } from "svelte";
  import { scale } from "svelte/transition";
  import { cn } from "../../lib/utils";
  import type { PopoverContext } from "./Popover.svelte";

  let {
    side = "bottom",
    align = "start",
    children,
    class: extraClass = "",
    ...rest
  }: PopoverContentProps = $props();

  const ctx = getContext<PopoverContext>("popover");

  $effect(() => {
    if (!ctx.open) return;

    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") ctx.close();
    }

    function onPointerDown(e: PointerEvent) {
      if (!ctx.wrapper?.contains(e.target as Node)) ctx.close();
    }

    document.addEventListener("keydown", onKeydown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  });
</script>

{#if ctx.open}
  <div
    role="dialog"
    class={cn(
      "absolute z-50 rounded-lg border border-border bg-background shadow-md",
      "min-w-48 p-3 focus:outline-none",
      side === "bottom" && align === "start" && "top-full left-0 mt-1.5",
      side === "bottom" && align === "center" && "top-full left-1/2 -translate-x-1/2 mt-1.5",
      side === "bottom" && align === "end" && "top-full right-0 mt-1.5",
      side === "top" && align === "start" && "bottom-full left-0 mb-1.5",
      side === "top" && align === "center" && "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
      side === "top" && align === "end" && "bottom-full right-0 mb-1.5",
      extraClass,
    )}
    transition:scale={{ start: 0.96, opacity: 0, duration: 130 }}
    {...rest}
  >
    {@render children?.()}
  </div>
{/if}
