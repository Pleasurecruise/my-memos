<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { children, class: extraClass = "", ...rest }: DialogHeaderProps = $props();
</script>

<div data-slot="header" class={cn("flex flex-col gap-1.5 mb-5", extraClass)} {...rest}>
  {@render children?.()}
</div>
