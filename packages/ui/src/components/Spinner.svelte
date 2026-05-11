<script module lang="ts">
	import type { SVGAttributes } from "svelte/elements";

	export type SpinnerSize = "sm" | "md" | "lg";

	export interface SpinnerProps extends SVGAttributes<SVGSVGElement> {
		size?: SpinnerSize;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	const sizes: Record<SpinnerSize, string> = {
		sm: "h-4 w-4",
		md: "h-5 w-5",
		lg: "h-6 w-6",
	};

	let { size = "md", class: extraClass = "", ...rest }: SpinnerProps = $props();
</script>

<svg
	class={cn("animate-spin text-muted-foreground", sizes[size], extraClass)}
	xmlns="http://www.w3.org/2000/svg"
	fill="none"
	viewBox="0 0 24 24"
	aria-hidden="true"
	{...rest}
>
	<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
	<path
		class="opacity-75"
		fill="currentColor"
		d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
	/>
</svg>