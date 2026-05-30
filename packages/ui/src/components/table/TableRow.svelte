<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: TableRowProps = $props();
</script>

<tr
  data-slot="row"
  class={cn("border-b border-border transition-colors hover:bg-muted/50", extraClass)}
  {...rest}
>
  {@render children?.()}
</tr>
