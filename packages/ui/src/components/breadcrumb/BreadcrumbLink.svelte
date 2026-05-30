<script lang="ts">
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface BreadcrumbLinkProps extends HTMLAnchorAttributes {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: BreadcrumbLinkProps = $props();
</script>

<a data-slot="link" class={cn("transition-colors hover:text-foreground", extraClass)} {...rest}>
  {@render children?.()}
</a>
