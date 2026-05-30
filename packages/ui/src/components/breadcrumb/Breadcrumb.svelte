<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: BreadcrumbProps = $props();
</script>

<nav aria-label="breadcrumb" data-slot="root" class={cn(extraClass)} {...rest}>
  {@render children?.()}
</nav>
