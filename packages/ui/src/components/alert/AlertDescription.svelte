<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface AlertDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../../lib/utils";

	let { class: extraClass = "", children, ...rest }: AlertDescriptionProps = $props();
</script>

<p class={cn("text-sm opacity-80", extraClass)} {...rest}>
	{@render children?.()}
</p>