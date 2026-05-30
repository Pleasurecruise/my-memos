<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface CommandGroupProps extends HTMLAttributes<HTMLDivElement> {
    heading?: string;
    children?: Snippet;
  }

  let { heading, class: extraClass = "", children, ...rest }: CommandGroupProps = $props();
</script>

<div role="group" data-slot="group" class={cn("overflow-hidden p-1", extraClass)} {...rest}>
  {#if heading}
    <div class="px-2 py-1.5 text-xs font-medium text-muted-foreground">
      {heading}
    </div>
  {/if}
  {@render children?.()}
</div>
