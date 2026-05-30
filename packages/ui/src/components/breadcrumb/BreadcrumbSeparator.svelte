<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface BreadcrumbSeparatorProps extends HTMLAttributes<HTMLLIElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: BreadcrumbSeparatorProps = $props();
</script>

<li
  aria-hidden="true"
  data-slot="separator"
  class={cn("select-none text-muted-foreground/50", extraClass)}
  {...rest}
>
  {#if children}
    {@render children()}
  {:else}
    /
  {/if}
</li>
