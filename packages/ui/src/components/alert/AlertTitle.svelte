<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export interface AlertTitleProps extends HTMLAttributes<HTMLParagraphElement> {
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { cn } from "../../lib/utils";

  let { class: extraClass = "", children, ...rest }: AlertTitleProps = $props();
</script>

<p class={cn("mb-1 font-medium leading-none tracking-tight", extraClass)} {...rest}>
  {@render children?.()}
</p>
