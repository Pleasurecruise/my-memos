<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
    value?: number;
  }
</script>

<script lang="ts">
  import { cn } from "../lib/utils";

  let { value = 0, class: extraClass = "", ...rest }: ProgressProps = $props();

  const clamped = $derived(Math.min(100, Math.max(0, value)));
</script>

<div
  role="progressbar"
  aria-valuenow={clamped}
  aria-valuemin={0}
  aria-valuemax={100}
  class={cn("h-1.5 w-full overflow-hidden rounded-full bg-border", extraClass)}
  {...rest}
>
  <div
    class="h-full w-[var(--progress-width)] bg-accent transition-[width] duration-300 ease-out"
    style="--progress-width: {clamped}%"
  ></div>
</div>
