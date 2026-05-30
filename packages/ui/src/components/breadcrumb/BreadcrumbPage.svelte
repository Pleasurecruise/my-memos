<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface BreadcrumbPageProps extends HTMLAttributes<HTMLSpanElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: BreadcrumbPageProps = $props();
</script>

<span
  aria-current="page"
  data-slot="page"
  class={cn("font-medium text-foreground", extraClass)}
  {...rest}
>
  {@render children?.()}
</span>
