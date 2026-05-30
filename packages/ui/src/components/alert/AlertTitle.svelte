<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface AlertTitleProps extends HTMLAttributes<HTMLParagraphElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: AlertTitleProps = $props();
</script>

<p
  data-slot="title"
  class={cn("mb-1 font-medium leading-none tracking-tight", extraClass)}
  {...rest}
>
  {@render children?.()}
</p>
