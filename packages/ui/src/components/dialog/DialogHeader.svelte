<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { cn } from "../../lib/utils";

  let { children, class: extraClass = "", ...rest }: DialogHeaderProps = $props();
</script>

<div class={cn("flex flex-col gap-1.5 mb-5", extraClass)} {...rest}>
  {@render children?.()}
</div>
