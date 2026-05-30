<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "../../lib/utils";

  export interface DropdownMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {}

  let { class: extraClass = "", ...rest }: DropdownMenuSeparatorProps = $props();
</script>

<div
  role="separator"
  data-slot="separator"
  class={cn("-mx-1 my-1 h-px bg-border", extraClass)}
  {...rest}
></div>
