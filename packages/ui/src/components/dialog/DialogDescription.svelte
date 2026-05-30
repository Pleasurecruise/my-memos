<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface DialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
    children?: Snippet;
  }

  let { children, class: extraClass = "", ...rest }: DialogDescriptionProps = $props();
</script>

<p
  data-slot="description"
  class={cn("text-sm text-muted-foreground leading-relaxed", extraClass)}
  {...rest}
>
  {@render children?.()}
</p>
