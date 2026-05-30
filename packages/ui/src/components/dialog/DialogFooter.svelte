<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { children, class: extraClass = "", ...rest }: DialogFooterProps = $props();
</script>

<div data-slot="footer" class={cn("flex flex-row justify-end gap-2 mt-6", extraClass)} {...rest}>
  {@render children?.()}
</div>
