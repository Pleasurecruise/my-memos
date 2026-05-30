<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { cn } from "../../lib/utils";

  export interface TableProps extends HTMLAttributes<HTMLTableElement> {
    children?: Snippet;
  }

  let { class: extraClass = "", children, ...rest }: TableProps = $props();
</script>

<div class="w-full overflow-x-auto">
  <table
    data-slot="root"
    class={cn("w-full caption-bottom font-sans text-sm", extraClass)}
    {...rest}
  >
    {@render children?.()}
  </table>
</div>
