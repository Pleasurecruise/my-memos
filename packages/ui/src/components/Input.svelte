<script module lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";

	export interface InputProps extends HTMLInputAttributes {
		error?: boolean;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	const base = cn(
		"flex h-9 w-full rounded-md border bg-background px-3 py-1",
		"font-sans text-sm text-foreground placeholder:text-muted-foreground",
		"outline-none transition-colors duration-100",
		"focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
		"disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
	);

	let { error, class: extraClass = "", ...rest }: InputProps = $props();
</script>

<input
	class={cn(
		base,
		error ? "border-error focus-visible:ring-error" : "border-border focus-visible:ring-accent",
		extraClass,
	)}
	{...rest}
/>