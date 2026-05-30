<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface DropdownMenuLabelProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { children, class: extraClass = "", ...rest }: DropdownMenuLabelProps = $props();
</script>

<div
  data-slot="label"
  class={cn("px-2 py-1.5 font-sans text-xs font-medium text-muted-foreground", extraClass)}
  {...rest}
>
  {@render children?.()}
</div>
