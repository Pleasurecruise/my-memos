<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { getContext } from "svelte";
  import { cn } from "../../lib/utils";
  import type { CommandContext } from "./Command.svelte";

  export interface CommandListProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: CommandListProps = $props();

  const ctx = getContext<CommandContext>("command");

  let containerEl: HTMLDivElement | undefined = $state();

  $effect(() => {
    const activeIndex = ctx.activeIndex;
    const el = containerEl;
    if (!el || activeIndex < 0) return;

    const frame = requestAnimationFrame(() => {
      const activeItem = el.querySelector(`[data-command-index="${activeIndex}"]`);
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    });

    return () => cancelAnimationFrame(frame);
  });
</script>

<div
  bind:this={containerEl}
  role="listbox"
  data-slot="list"
  class={cn("max-h-72 overflow-y-auto overflow-x-hidden p-1 scrollbar-none", extraClass)}
  {...rest}
>
  {@render children?.()}
</div>

<style>
  .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
</style>
