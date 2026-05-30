<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: TableBodyProps = $props();
</script>

<tbody data-slot="body" class={cn("[&_tr:last-child]:border-0", extraClass)} {...rest}>
  {@render children?.()}
</tbody>
