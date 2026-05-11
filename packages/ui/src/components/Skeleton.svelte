<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	let { class: extraClass = "", children, ...rest }: SkeletonProps = $props();
</script>

<div class={cn("animate-pulse rounded-md bg-border", extraClass)} {...rest}>
	{@render children?.()}
</div>