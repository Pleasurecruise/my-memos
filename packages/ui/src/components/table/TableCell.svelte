<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
    children?: Snippet;
    colSpan?: number;
  }
</script>

<script lang="ts">
  import { cn } from "../../lib/utils";

  let { class: extraClass = "", children, ...rest }: TableCellProps = $props();
</script>

<td class={cn("px-4 py-3 align-middle text-foreground", extraClass)} {...rest}>
  {@render children?.()}
</td>
