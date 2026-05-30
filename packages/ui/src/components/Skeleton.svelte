<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../lib/utils";

  export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: SkeletonProps = $props();
</script>

<div class={cn("animate-pulse rounded-md bg-border", extraClass)} {...rest}>
  {@render children?.()}
</div>
