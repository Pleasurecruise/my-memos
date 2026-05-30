<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface BreadcrumbItemProps extends HTMLAttributes<HTMLLIElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: BreadcrumbItemProps = $props();
</script>

<li data-slot="item" class={cn("inline-flex items-center gap-1", extraClass)} {...rest}>
  {@render children?.()}
</li>
