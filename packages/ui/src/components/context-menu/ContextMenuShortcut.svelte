<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "../../lib/utils";

  export interface ContextMenuShortcutProps extends HTMLAttributes<HTMLSpanElement> {}

  let { class: extraClass = "", ...rest }: ContextMenuShortcutProps = $props();
</script>

<span
  data-slot="shortcut"
  class={cn("ml-auto font-mono text-[11px] tracking-widest text-muted-foreground", extraClass)}
  {...rest}
></span>
