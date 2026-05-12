<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../../lib/utils";

	let { class: extraClass = "", children, ...rest }: TableRowProps = $props();
</script>

<tr
	class={cn("border-b border-border transition-colors hover:bg-muted/50", extraClass)}
	{...rest}
>
	{@render children?.()}
</tr>