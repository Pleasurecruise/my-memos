<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface CardProps extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../../lib/utils";

	let { class: extraClass = "", children, ...rest }: CardProps = $props();
</script>

<div
	class={cn(
		"rounded-lg border border-border bg-background",
		"shadow-[0_1px_3px_0_rgba(0,0,0,.04)]",
		extraClass,
	)}
	{...rest}
>
	{@render children?.()}
</div>