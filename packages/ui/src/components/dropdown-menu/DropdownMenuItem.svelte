<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { getContext } from "svelte";
  import { cn } from "../../lib/utils";
  import type { DropdownMenuContext } from "./DropdownMenu.svelte";

  export interface DropdownMenuItemProps extends HTMLButtonAttributes {
    destructive?: boolean;
    children?: Snippet;
  }

  let {
    destructive = false,
    children,
    class: extraClass = "",
    onclick,
    ...rest
  }: DropdownMenuItemProps = $props();

  const ctx = getContext<DropdownMenuContext>("dropdown-menu");

  function handleClick(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
    onclick?.(e);
    ctx.close();
  }
</script>

<button
  type="button"
  role="menuitem"
  data-slot="item"
  tabindex={-1}
  class={cn(
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5",
    "font-sans text-sm cursor-pointer select-none outline-none",
    "transition-colors duration-75",
    "focus:bg-muted",
    "disabled:pointer-events-none disabled:opacity-50",
    destructive ? "text-error focus:bg-error/10" : "text-foreground",
    extraClass,
  )}
  onclick={handleClick}
  {...rest}
>
  {@render children?.()}
</button>
