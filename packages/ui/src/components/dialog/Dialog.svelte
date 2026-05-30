<script lang="ts">
  import type { Snippet } from "svelte";
  import { setContext } from "svelte";

  export interface DialogContext {
    readonly open: boolean;
    close(): void;
  }

  export interface DialogProps {
    open?: boolean;
    children?: Snippet;
  }

  let { open = $bindable(false), children }: DialogProps = $props();

  setContext<DialogContext>("dialog", {
    get open() {
      return open;
    },
    close() {
      open = false;
    },
  });
</script>

{@render children?.()}
