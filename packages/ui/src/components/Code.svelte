<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../lib/utils";

  export interface CodeProps extends HTMLAttributes<HTMLElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: CodeProps = $props();
</script>

<code
  class={cn(
    "rounded border border-border bg-muted px-1.5 py-0.5",
    "font-mono text-sm text-foreground",
    extraClass,
  )}
  {...rest}
>
  {@render children?.()}
</code>
