<script module lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export interface DropdownMenuTriggerProps extends HTMLButtonAttributes {
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { getContext } from "svelte";
  import type { DropdownMenuContext } from "./DropdownMenu.svelte";

  let { children, class: extraClass = "", ...rest }: DropdownMenuTriggerProps = $props();

  const ctx = getContext<DropdownMenuContext>("dropdown-menu");
</script>

<button
  type="button"
  aria-expanded={ctx.open}
  aria-haspopup="menu"
  onclick={() => ctx.toggle()}
  class={extraClass}
  {...rest}
>
  {@render children?.()}
</button>
