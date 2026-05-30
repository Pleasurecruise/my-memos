<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: CardHeaderProps = $props();
</script>

<div data-slot="header" class={cn("flex flex-col gap-1.5 p-6", extraClass)} {...rest}>
  {@render children?.()}
</div>
