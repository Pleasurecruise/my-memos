<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "../../lib/utils";

  export interface CommandInputProps extends HTMLInputAttributes {}

  let { class: extraClass = "", ...rest }: CommandInputProps = $props();
</script>

<input
  type="text"
  data-slot="input"
  class={cn(
    "flex h-10 w-full rounded-md bg-transparent px-3 py-1 text-sm",
    "outline-none placeholder:text-muted-foreground",
    "disabled:cursor-not-allowed disabled:opacity-50",
    extraClass,
  )}
  {...rest}
/>
