<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../../lib/utils";

	let { class: extraClass = "", children, ...rest }: TabsListProps = $props();
</script>

<div role="tablist" class={cn("flex border-b border-border", extraClass)} {...rest}>
	{@render children?.()}
</div>