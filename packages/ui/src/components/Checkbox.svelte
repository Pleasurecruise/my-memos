<script module lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";

	export interface CheckboxProps extends Omit<HTMLInputAttributes, "type"> {
		error?: boolean;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	let { error, class: extraClass = "", ...rest }: CheckboxProps = $props();
</script>

<span class={cn("relative inline-flex h-4 w-4 shrink-0", extraClass)}>
	<input type="checkbox" class="peer absolute inset-0 cursor-pointer opacity-0" {...rest} />
	<span
		aria-hidden="true"
		class={cn(
			"pointer-events-none flex h-4 w-4 items-center justify-center rounded border transition-colors duration-100",
			"peer-checked:bg-accent peer-checked:border-accent",
			"peer-checked:text-accent-foreground text-transparent",
			"peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
			"peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
			error ? "border-error bg-background" : "border-border bg-background",
		)}
	>
		<svg
			class="h-2.5 w-2.5"
			viewBox="0 0 10 8"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M1 4l3 3 5-6" />
		</svg>
	</span>
</span>