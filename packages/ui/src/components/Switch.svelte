<script module lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";

	export interface SwitchProps extends Omit<HTMLInputAttributes, "type"> {}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	let { class: extraClass = "", ...rest }: SwitchProps = $props();
</script>

<span class={cn("relative inline-flex h-5 w-9 shrink-0", extraClass)}>
	<input
		type="checkbox"
		role="switch"
		class="peer absolute inset-0 cursor-pointer opacity-0"
		{...rest}
	/>
	<span
		aria-hidden="true"
		class={cn(
			"absolute inset-0 rounded-full border border-border bg-muted",
			"transition-colors duration-200",
			"peer-checked:border-accent peer-checked:bg-accent",
			"peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
			"peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
		)}
	></span>
	<span
		aria-hidden="true"
		class={cn(
			"absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-muted-foreground/60 shadow-sm",
			"transition-all duration-200",
			"peer-checked:translate-x-4 peer-checked:bg-accent-foreground",
			"peer-disabled:opacity-50",
		)}
	></span>
</span>