<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../../lib/utils";

	let { class: extraClass = "", children, ...rest }: BreadcrumbProps = $props();
</script>

<nav aria-label="breadcrumb" class={cn(extraClass)} {...rest}>
	{@render children?.()}
</nav>