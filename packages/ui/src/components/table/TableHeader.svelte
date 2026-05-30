<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: TableHeaderProps = $props();
</script>

<thead data-slot="header" class={cn("border-b border-border", extraClass)} {...rest}>
  {@render children?.()}
</thead>
