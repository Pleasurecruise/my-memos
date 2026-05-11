<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface TableFooterProps extends HTMLAttributes<HTMLTableSectionElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	let { class: extraClass = "", children, ...rest }: TableFooterProps = $props();
</script>

<tfoot
	class={cn("border-t border-border font-medium text-foreground", extraClass)}
	{...rest}
>
	{@render children?.()}
</tfoot>