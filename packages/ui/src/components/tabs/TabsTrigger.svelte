<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { getContext } from "svelte";
  import { cn } from "../../lib/utils";
  import type { TabsContext } from "./Tabs.svelte";

  export interface TabsTriggerProps extends HTMLButtonAttributes {
    value: string;
    children?: Snippet;
  }

  let { value, class: extraClass = "", children, onclick, ...rest }: TabsTriggerProps = $props();

  const ctx = getContext<TabsContext>("tabs");
  const active = $derived(ctx.value === value);

  function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    onclick?.(e);
    if (!e.defaultPrevented) ctx.onValueChange(value);
  }
</script>

<button
  role="tab"
  type="button"
  data-slot="trigger"
  aria-selected={active}
  data-state={active ? "active" : "inactive"}
  onclick={handleClick}
  class={cn(
    "-mb-px border-b-2 px-4 py-2 font-sans text-sm font-medium",
    "cursor-pointer transition-colors duration-100",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    active
      ? "border-accent text-foreground"
      : "border-transparent text-muted-foreground hover:text-foreground",
    extraClass,
  )}
  {...rest}
>
  {@render children?.()}
</button>
