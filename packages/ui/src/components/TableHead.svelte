<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	let { class: extraClass = "", children, ...rest }: TableHeadProps = $props();
</script>

<th
	class={cn(
		"h-10 px-4 text-left align-middle font-medium text-muted-foreground",
		extraClass,
	)}
	{...rest}
>
	{@render children?.()}
</th>