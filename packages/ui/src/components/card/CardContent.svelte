<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: CardContentProps = $props();
</script>

<div data-slot="content" class={cn("p-6 pt-0", extraClass)} {...rest}>
  {@render children?.()}
</div>
