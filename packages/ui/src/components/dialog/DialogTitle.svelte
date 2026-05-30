<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
    children?: Snippet;
  }

  let { children, class: extraClass = "", ...rest }: DialogTitleProps = $props();
</script>

<h2
  data-slot="title"
  class={cn("text-base font-semibold text-foreground leading-tight", extraClass)}
  {...rest}
>
  {@render children?.()}
</h2>
