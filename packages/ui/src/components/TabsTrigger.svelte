<script module lang="ts">
	import type { HTMLButtonAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface TabsTriggerProps extends HTMLButtonAttributes {
		active?: boolean;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	let { active, class: extraClass = "", children, ...rest }: TabsTriggerProps = $props();
</script>

<button
	role="tab"
	type="button"
	aria-selected={active}
	class={cn(
		"-mb-px border-b-2 px-4 py-2 font-sans text-sm font-medium",
		"cursor-pointer transition-colors duration-100",
		"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
		"disabled:pointer-events-none disabled:opacity-50",
		active
			? "border-accent text-foreground"
			: "border-transparent text-muted-foreground hover:text-foreground",
		extraClass,
	)}
	{...rest}
>
	{@render children?.()}
</button>