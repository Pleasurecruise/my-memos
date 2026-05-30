<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { getContext } from "svelte";
  import { slide } from "svelte/transition";
  import { cn } from "../../lib/utils";
  import type { CollapsibleContext } from "./Collapsible.svelte";

  export interface CollapsibleContentProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { children, class: extraClass = "", ...rest }: CollapsibleContentProps = $props();

  const ctx = getContext<CollapsibleContext>("collapsible");
</script>

{#if ctx.open}
  <div
    data-state="open"
    data-slot="content"
    class={cn("overflow-hidden", extraClass)}
    transition:slide={{ duration: 150 }}
    {...rest}
  >
    {@render children?.()}
  </div>
{/if}
