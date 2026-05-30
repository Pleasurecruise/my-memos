<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: CardDescriptionProps = $props();
</script>

<p
  data-slot="description"
  class={cn("font-sans text-sm text-muted-foreground", extraClass)}
  {...rest}
>
  {@render children?.()}
</p>
