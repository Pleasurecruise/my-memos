<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../../lib/utils";

	let { class: extraClass = "", children, ...rest }: CardTitleProps = $props();
</script>

<h3
	class={cn(
		"font-sans text-base font-semibold leading-none text-foreground",
		extraClass,
	)}
	{...rest}
>
	{@render children?.()}
</h3>