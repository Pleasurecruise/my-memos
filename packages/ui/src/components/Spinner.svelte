<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  export type SpinnerSize = "sm" | "md" | "lg";

  export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
    size?: SpinnerSize;
  }
</script>

<script lang="ts">
  import { Loader2 } from "@lucide/svelte";
  import { cn } from "../lib/utils";

  const sizes: Record<SpinnerSize, number> = { sm: 16, md: 20, lg: 24 };

  let { size = "md", class: extraClass = "", ...rest }: SpinnerProps = $props();
</script>

<span class={cn("inline-flex text-muted-foreground", extraClass)} aria-hidden="true" {...rest}>
  <Loader2 size={sizes[size]} class="animate-spin" />
</span>
