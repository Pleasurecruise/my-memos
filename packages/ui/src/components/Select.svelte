<script module lang="ts">
	import type { HTMLSelectAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface SelectProps extends HTMLSelectAttributes {
		error?: boolean;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	const base = cn(
		"flex h-9 w-full appearance-none rounded-md border bg-background px-3 py-1 pr-8",
		"font-sans text-sm text-foreground",
		"outline-none transition-colors duration-100 cursor-pointer",
		"focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
		"disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
	);

	let { error, class: extraClass = "", children, ...rest }: SelectProps = $props();
</script>

<div class={cn("relative w-full", extraClass)}>
	<select
		class={cn(
			base,
			error ? "border-error focus-visible:ring-error" : "border-border focus-visible:ring-accent",
		)}
		{...rest}
	>
		{@render children?.()}
	</select>
	<span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	</span>
</div>