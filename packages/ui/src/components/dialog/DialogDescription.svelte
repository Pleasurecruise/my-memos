<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export interface DialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { cn } from "../../lib/utils";

  let { children, class: extraClass = "", ...rest }: DialogDescriptionProps = $props();
</script>

<p class={cn("text-sm text-muted-foreground leading-relaxed", extraClass)} {...rest}>
  {@render children?.()}
</p>
