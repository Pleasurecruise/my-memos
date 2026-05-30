<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
    children?: Snippet;
    colSpan?: number;
  }

  let { class: extraClass = "", children, ...rest }: TableCellProps = $props();
</script>

<td data-slot="cell" class={cn("px-4 py-3 align-middle text-foreground", extraClass)} {...rest}>
  {@render children?.()}
</td>
