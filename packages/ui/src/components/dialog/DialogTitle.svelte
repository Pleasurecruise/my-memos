<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../../lib/utils";

	let { children, class: extraClass = "", ...rest }: DialogTitleProps = $props();
</script>

<h2 class={cn("text-base font-semibold text-foreground leading-tight", extraClass)} {...rest}>
	{@render children?.()}
</h2>