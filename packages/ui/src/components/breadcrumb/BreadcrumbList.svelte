<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export interface BreadcrumbListProps extends HTMLAttributes<HTMLOListElement> {
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { cn } from "../../lib/utils";

  let { class: extraClass = "", children, ...rest }: BreadcrumbListProps = $props();
</script>

<ol
  class={cn(
    "flex flex-wrap items-center gap-1 font-sans text-sm text-muted-foreground",
    extraClass,
  )}
  {...rest}
>
  {@render children?.()}
</ol>
