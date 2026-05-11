<script module lang="ts">
	import type { HTMLTextareaAttributes } from "svelte/elements";

	export interface TextareaProps extends HTMLTextareaAttributes {
		error?: boolean;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	const base = cn(
		"flex min-h-20 w-full rounded-md border bg-background px-3 py-2",
		"font-sans text-sm text-foreground placeholder:text-muted-foreground",
		"outline-none transition-colors duration-100 resize-y",
		"focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
		"disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
	);

	let { error, class: extraClass = "", ...rest }: TextareaProps = $props();
</script>

<textarea
	class={cn(
		base,
		error ? "border-error focus-visible:ring-error" : "border-border focus-visible:ring-accent",
		extraClass,
	)}
	{...rest}
></textarea>