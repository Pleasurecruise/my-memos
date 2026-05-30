<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: TableHeadProps = $props();
</script>

<th
  data-slot="head"
  class={cn("h-10 px-4 text-left align-middle font-medium text-muted-foreground", extraClass)}
  {...rest}
>
  {@render children?.()}
</th>
