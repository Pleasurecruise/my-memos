<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../../lib/utils";

	let { class: extraClass = "", children, ...rest }: CardFooterProps = $props();
</script>

<div class={cn("flex items-center p-6 pt-0", extraClass)} {...rest}>
	{@render children?.()}
</div>