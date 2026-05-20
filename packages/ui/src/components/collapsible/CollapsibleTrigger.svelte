<script module lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export interface CollapsibleTriggerProps extends HTMLButtonAttributes {
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { getContext } from "svelte";
  import { cn } from "../../lib/utils";
  import type { CollapsibleContext } from "./Collapsible.svelte";

  let {
    children,
    class: extraClass = "",
    type = "button",
    onclick,
    ...rest
  }: CollapsibleTriggerProps = $props();

  const ctx = getContext<CollapsibleContext>("collapsible");

  function handleClick(event: Parameters<NonNullable<HTMLButtonAttributes["onclick"]>>[0]) {
    onclick?.(event);
    if (!event.defaultPrevented) ctx.toggle();
  }
</script>

<button
  {type}
  aria-expanded={ctx.open}
  data-state={ctx.open ? "open" : "closed"}
  onclick={handleClick}
  class={cn(
    "inline-flex items-center gap-2",
    "cursor-pointer transition-colors duration-100",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    extraClass,
  )}
  {...rest}
>
  {@render children?.()}
</button>
