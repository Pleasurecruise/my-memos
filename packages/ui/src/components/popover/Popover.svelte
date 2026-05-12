<script module lang="ts">
	import type { Snippet } from "svelte";

	export interface PopoverContext {
		readonly open: boolean;
		readonly wrapper: HTMLDivElement | undefined;
		toggle(): void;
		close(): void;
	}

	export interface PopoverProps {
		open?: boolean;
		children?: Snippet;
		class?: string;
	}
</script>

<script lang="ts">
	import { setContext } from "svelte";
	import { cn } from "../../lib/utils";

	let { open = $bindable(false), children, class: extraClass = "" }: PopoverProps = $props();

	let wrapper: HTMLDivElement | undefined = $state();

	setContext<PopoverContext>("popover", {
		get open() {
			return open;
		},
		get wrapper() {
			return wrapper;
		},
		toggle() {
			open = !open;
		},
		close() {
			open = false;
		},
	});
</script>

<div bind:this={wrapper} class={cn("relative inline-flex", extraClass)}>
	{@render children?.()}
</div>