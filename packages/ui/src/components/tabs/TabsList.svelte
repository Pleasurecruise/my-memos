<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: TabsListProps = $props();
</script>

<div
  role="tablist"
  data-slot="list"
  class={cn("flex border-b border-border", extraClass)}
  {...rest}
>
  {@render children?.()}
</div>
