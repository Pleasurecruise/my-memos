<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: CardTitleProps = $props();
</script>

<h3
  data-slot="title"
  class={cn("font-sans text-base font-semibold leading-none text-foreground", extraClass)}
  {...rest}
>
  {@render children?.()}
</h3>
