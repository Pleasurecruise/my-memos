<script module lang="ts">
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export interface BreadcrumbLinkProps extends HTMLAnchorAttributes {
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { cn } from "../../lib/utils";

  let { class: extraClass = "", children, ...rest }: BreadcrumbLinkProps = $props();
</script>

<a class={cn("transition-colors hover:text-foreground", extraClass)} {...rest}>
  {@render children?.()}
</a>
