<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { setContext } from "svelte";
  import { cn } from "../../lib/utils";

  export interface CollapsibleContext {
    readonly open: boolean;
    toggle(): void;
    setOpen(value: boolean): void;
  }

  export interface CollapsibleProps extends HTMLAttributes<HTMLDivElement> {
    open?: boolean;
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    children,
    class: extraClass = "",
    ...rest
  }: CollapsibleProps = $props();

  setContext<CollapsibleContext>("collapsible", {
    get open() {
      return open;
    },
    toggle() {
      open = !open;
    },
    setOpen(value) {
      open = value;
    },
  });
</script>

<div
  data-slot="root"
  data-state={open ? "open" : "closed"}
  class={cn("w-full", extraClass)}
  {...rest}
>
  {@render children?.()}
</div>
