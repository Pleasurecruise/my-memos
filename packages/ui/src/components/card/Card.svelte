<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: CardProps = $props();
</script>

<div
  data-slot="root"
  class={cn("rounded-lg border border-border bg-background", "shadow-xs", extraClass)}
  {...rest}
>
  {@render children?.()}
</div>
