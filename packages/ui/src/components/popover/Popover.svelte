<script lang="ts">
  import type { Snippet } from "svelte";
  import { setContext } from "svelte";
  import { cn } from "../../lib/utils";

  export interface PopoverContext {
    readonly open: boolean;
    readonly wrapper: HTMLDivElement | undefined;
    toggle(): void;
    close(): void;
  }

  export interface PopoverProps {
    open?: boolean;
    children?: Snippet;
    class?: string;
  }

  let { open = $bindable(false), children, class: extraClass = "" }: PopoverProps = $props();

  let wrapper: HTMLDivElement | undefined = $state();

  setContext<PopoverContext>("popover", {
    get open() {
      return open;
    },
    get wrapper() {
      return wrapper;
    },
    toggle() {
      open = !open;
    },
    close() {
      open = false;
    },
  });
</script>

<div bind:this={wrapper} data-slot="root" class={cn("relative inline-flex", extraClass)}>
  {@render children?.()}
</div>
