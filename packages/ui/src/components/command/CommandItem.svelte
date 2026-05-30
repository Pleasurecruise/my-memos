<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { getContext } from "svelte";
  import { cn } from "../../lib/utils";
  import type { CommandItemData, CommandContext } from "./Command.svelte";

  export interface CommandItemProps extends HTMLButtonAttributes {
    item: CommandItemData;
    index: number;
    children?: Snippet;
  }

  let { item, index, class: extraClass = "", children, ...rest }: CommandItemProps = $props();

  const ctx = getContext<CommandContext>("command");

  const isActive = $derived(ctx.activeIndex === index);

  function handleSelect() {
    ctx.onSelect(item);
  }
</script>

<button
  type="button"
  role="option"
  data-slot="item"
  aria-selected={isActive}
  data-command-index={index}
  class={cn(
    "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
    "transition-colors duration-[var(--duration-fast)]",
    isActive ? "bg-accent text-accent-foreground" : "text-foreground",
    extraClass,
  )}
  onclick={handleSelect}
  {...rest}
>
  {@render children?.()}
</button>
