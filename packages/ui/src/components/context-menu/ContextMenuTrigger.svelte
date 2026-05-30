<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { getContext } from "svelte";
  import { cn } from "../../lib/utils";
  import type { ContextMenuContext } from "./ContextMenu.svelte";

  export interface ContextMenuTriggerProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: ContextMenuTriggerProps = $props();

  const ctx = getContext<ContextMenuContext>("context-menu");

  function handleContextmenu(e: MouseEvent) {
    e.preventDefault();
    ctx.openAt(e.clientX, e.clientY);
  }
</script>

<div data-slot="trigger" oncontextmenu={handleContextmenu} class={cn(extraClass)} {...rest}>
  {@render children?.()}
</div>
