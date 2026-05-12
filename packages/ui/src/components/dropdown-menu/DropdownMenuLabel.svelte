<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export interface DropdownMenuLabelProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { cn } from "../../lib/utils";

  let { children, class: extraClass = "", ...rest }: DropdownMenuLabelProps = $props();
</script>

<div
  class={cn("px-2 py-1.5 font-sans text-xs font-medium text-muted-foreground", extraClass)}
  {...rest}
>
  {@render children?.()}
</div>
