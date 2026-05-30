<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../lib/utils";

  export interface KbdProps extends HTMLAttributes<HTMLElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: KbdProps = $props();
</script>

<kbd
  class={cn(
    "inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5",
    "font-mono text-xs text-foreground shadow-xs",
    extraClass,
  )}
  {...rest}
>
  {@render children?.()}
</kbd>
