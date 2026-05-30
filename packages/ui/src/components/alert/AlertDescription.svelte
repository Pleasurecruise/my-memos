<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface AlertDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: AlertDescriptionProps = $props();
</script>

<p data-slot="description" class={cn("text-sm opacity-80", extraClass)} {...rest}>
  {@render children?.()}
</p>
