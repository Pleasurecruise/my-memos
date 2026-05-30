<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface BreadcrumbListProps extends HTMLAttributes<HTMLOListElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: BreadcrumbListProps = $props();
</script>

<ol
  data-slot="list"
  class={cn(
    "flex flex-wrap items-center gap-1 font-sans text-sm text-muted-foreground",
    extraClass,
  )}
  {...rest}
>
  {@render children?.()}
</ol>
