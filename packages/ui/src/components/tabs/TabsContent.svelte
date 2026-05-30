<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { getContext } from "svelte";
  import { cn } from "../../lib/utils";
  import type { TabsContext } from "./Tabs.svelte";

  export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
    value: string;
    children?: Snippet;
  }

  let { value, class: extraClass = "", children, ...rest }: TabsContentProps = $props();

  const ctx = getContext<TabsContext>("tabs");
  const active = $derived(ctx.value === value);
</script>

{#if active}
  <div
    role="tabpanel"
    data-slot="content"
    data-state={active ? "active" : "inactive"}
    class={cn("pt-4", extraClass)}
    {...rest}
  >
    {@render children?.()}
  </div>
{/if}
