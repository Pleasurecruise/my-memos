<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "../../lib/utils";

  export interface ContextMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {}

  let { class: extraClass = "", ...rest }: ContextMenuSeparatorProps = $props();
</script>

<div
  role="separator"
  data-slot="separator"
  class={cn("-mx-1 my-1 h-px bg-border", extraClass)}
  {...rest}
></div>
