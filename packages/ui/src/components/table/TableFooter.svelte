<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface TableFooterProps extends HTMLAttributes<HTMLTableSectionElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: TableFooterProps = $props();
</script>

<tfoot
  data-slot="footer"
  class={cn("border-t border-border font-medium text-foreground", extraClass)}
  {...rest}
>
  {@render children?.()}
</tfoot>
