<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface PreProps extends HTMLAttributes<HTMLPreElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	let { class: extraClass = "", children, ...rest }: PreProps = $props();
</script>

<pre
	class={cn(
		"overflow-x-auto rounded-lg border border-border bg-muted p-4",
		"font-mono text-sm leading-relaxed text-foreground",
		extraClass,
	)}
	{...rest}>{@render children?.()}</pre>