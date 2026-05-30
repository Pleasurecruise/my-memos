<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface CommandEmptyProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: CommandEmptyProps = $props();
</script>

<div
  data-slot="empty"
  class={cn("py-6 text-center text-sm text-muted-foreground", extraClass)}
  {...rest}
>
  {@render children?.()}
</div>
