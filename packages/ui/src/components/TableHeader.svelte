<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	let { class: extraClass = "", children, ...rest }: TableHeaderProps = $props();
</script>

<thead class={cn("border-b border-border", extraClass)} {...rest}>
	{@render children?.()}
</thead>