<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	let { class: extraClass = "", children, ...rest }: CardDescriptionProps = $props();
</script>

<p class={cn("font-sans text-sm text-muted-foreground", extraClass)} {...rest}>
	{@render children?.()}
</p>