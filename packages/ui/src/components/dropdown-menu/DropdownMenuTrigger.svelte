<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { getContext } from "svelte";
  import type { DropdownMenuContext } from "./DropdownMenu.svelte";

  export interface DropdownMenuTriggerProps extends HTMLButtonAttributes {
    children?: Snippet;
  }

  let { children, class: extraClass = "", ...rest }: DropdownMenuTriggerProps = $props();

  const ctx = getContext<DropdownMenuContext>("dropdown-menu");
</script>

<button
  type="button"
  data-slot="trigger"
  aria-expanded={ctx.open}
  aria-haspopup="menu"
  onclick={() => ctx.toggle()}
  class={extraClass}
  {...rest}
>
  {@render children?.()}
</button>
