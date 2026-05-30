<script lang="ts">
  import type { Snippet } from "svelte";
  import { setContext } from "svelte";

  export interface ContextMenuContext {
    open: boolean;
    x: number;
    y: number;
    openAt: (x: number, y: number) => void;
    close: () => void;
  }

  export interface ContextMenuProps {
    children?: Snippet;
  }

  let { children }: ContextMenuProps = $props();

  let open = $state(false);
  let x = $state(0);
  let y = $state(0);

  function openAt(newX: number, newY: number) {
    x = newX;
    y = newY;
    open = true;
  }

  function close() {
    open = false;
  }

  setContext<ContextMenuContext>("context-menu", {
    get open() {
      return open;
    },
    get x() {
      return x;
    },
    get y() {
      return y;
    },
    openAt,
    close,
  });
</script>

{@render children?.()}
