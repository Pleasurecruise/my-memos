<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export interface BreadcrumbPageProps extends HTMLAttributes<HTMLSpanElement> {
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { cn } from "../../lib/utils";

  let { class: extraClass = "", children, ...rest }: BreadcrumbPageProps = $props();
</script>

<span aria-current="page" class={cn("font-medium text-foreground", extraClass)} {...rest}>
  {@render children?.()}
</span>
