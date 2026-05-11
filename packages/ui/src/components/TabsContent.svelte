<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	let { class: extraClass = "", children, ...rest }: TabsContentProps = $props();
</script>

<div role="tabpanel" class={cn("pt-4", extraClass)} {...rest}>
	{@render children?.()}
</div>