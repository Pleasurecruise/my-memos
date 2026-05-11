<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface BreadcrumbSeparatorProps extends HTMLAttributes<HTMLLIElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../lib/utils";

	let { class: extraClass = "", children, ...rest }: BreadcrumbSeparatorProps = $props();
</script>

<li
	aria-hidden="true"
	class={cn("select-none text-muted-foreground/50", extraClass)}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		/
	{/if}
</li>