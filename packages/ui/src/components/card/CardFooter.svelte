<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: CardFooterProps = $props();
</script>

<div data-slot="footer" class={cn("flex items-center p-6 pt-0", extraClass)} {...rest}>
  {@render children?.()}
</div>
