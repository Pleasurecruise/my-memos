<script module lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export interface PopoverTriggerProps extends HTMLButtonAttributes {
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { getContext } from "svelte";
  import type { PopoverContext } from "./Popover.svelte";

  let { children, class: extraClass = "", ...rest }: PopoverTriggerProps = $props();

  const ctx = getContext<PopoverContext>("popover");
</script>

<button
  type="button"
  aria-expanded={ctx.open}
  aria-haspopup="dialog"
  onclick={() => ctx.toggle()}
  class={extraClass}
  {...rest}
>
  {@render children?.()}
</button>
