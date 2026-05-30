<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface TableCaptionProps extends HTMLAttributes<HTMLElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: TableCaptionProps = $props();
</script>

<caption data-slot="caption" class={cn("mt-4 text-sm text-muted-foreground", extraClass)} {...rest}>
  {@render children?.()}
</caption>
