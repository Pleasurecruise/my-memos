<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export interface BreadcrumbItemProps extends HTMLAttributes<HTMLLIElement> {
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { cn } from "../../lib/utils";

  let { class: extraClass = "", children, ...rest }: BreadcrumbItemProps = $props();
</script>

<li class={cn("inline-flex items-center gap-1", extraClass)} {...rest}>
  {@render children?.()}
</li>
