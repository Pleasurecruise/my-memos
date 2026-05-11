<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	let { class: extraClass = "", children, ...rest }: CardHeaderProps = $props();
</script>

<div class={cn("flex flex-col gap-1.5 p-6", extraClass)} {...rest}>
	{@render children?.()}
</div>