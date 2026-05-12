<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../../lib/utils";

	let { class: extraClass = "", children, ...rest }: TableBodyProps = $props();
</script>

<tbody class={cn("[&_tr:last-child]:border-0", extraClass)} {...rest}>
	{@render children?.()}
</tbody>