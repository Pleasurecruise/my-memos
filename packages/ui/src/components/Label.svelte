<script lang="ts">
  import type { HTMLLabelAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../lib/utils";

  export interface LabelProps extends HTMLLabelAttributes {
    required?: boolean;
    children?: Snippet;
  }

  let { required, class: extraClass = "", children, ...rest }: LabelProps = $props();
</script>

<label
  class={cn(
    "font-sans text-sm font-medium leading-none text-foreground",
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    required && "after:ml-1 after:text-error after:content-['*']",
    extraClass,
  )}
  {...rest}
>
  {@render children?.()}
</label>
