<script lang="ts">
  import type { Snippet } from "svelte";
  import { setContext } from "svelte";

  export interface TabsContext {
    readonly value: string;
    onValueChange(value: string): void;
  }

  export interface TabsProps {
    value?: string;
    onValueChange?: (value: string) => void;
    children?: Snippet;
  }

  let { value = $bindable(""), onValueChange, children }: TabsProps = $props();

  function handleValueChange(newValue: string) {
    value = newValue;
    onValueChange?.(newValue);
  }

  setContext<TabsContext>("tabs", {
    get value() {
      return value;
    },
    onValueChange: handleValueChange,
  });
</script>

{@render children?.()}
