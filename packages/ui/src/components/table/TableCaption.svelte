<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface TableCaptionProps extends HTMLAttributes<HTMLElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../../lib/utils";

	let { class: extraClass = "", children, ...rest }: TableCaptionProps = $props();
</script>

<caption class={cn("mt-4 text-sm text-muted-foreground", extraClass)} {...rest}>
	{@render children?.()}
</caption>