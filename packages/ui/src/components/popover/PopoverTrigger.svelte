<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { getContext } from "svelte";
  import type { PopoverContext } from "./Popover.svelte";

  export interface PopoverTriggerProps extends HTMLButtonAttributes {
    children?: Snippet;
  }

  let { children, class: extraClass = "", ...rest }: PopoverTriggerProps = $props();

  const ctx = getContext<PopoverContext>("popover");
</script>

<button
  type="button"
  data-slot="trigger"
  aria-expanded={ctx.open}
  aria-haspopup="dialog"
  onclick={() => ctx.toggle()}
  class={extraClass}
  {...rest}
>
  {@render children?.()}
</button>
