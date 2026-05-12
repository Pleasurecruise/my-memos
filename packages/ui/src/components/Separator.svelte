<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
    orientation?: "horizontal" | "vertical";
  }
</script>

<script lang="ts">
  import { cn } from "../lib/utils";

  let { orientation = "horizontal", class: extraClass = "", ...rest }: SeparatorProps = $props();
</script>

<div
  role="separator"
  aria-orientation={orientation}
  class={cn(
    "shrink-0 bg-divider",
    orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
    extraClass,
  )}
  {...rest}
></div>
