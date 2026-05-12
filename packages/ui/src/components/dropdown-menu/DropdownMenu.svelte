<script module lang="ts">
	import type { Snippet } from "svelte";

	export interface DropdownMenuContext {
		readonly open: boolean;
		readonly wrapper: HTMLDivElement | undefined;
		toggle(): void;
		close(): void;
	}

	export interface DropdownMenuProps {
		open?: boolean;
		children?: Snippet;
		class?: string;
	}
</script>

<script lang="ts">
	import { setContext } from "svelte";
	import { cn } from "../../lib/utils";

	let { open = $bindable(false), children, class: extraClass = "" }: DropdownMenuProps = $props();

	let wrapper: HTMLDivElement | undefined = $state();

	setContext<DropdownMenuContext>("dropdown-menu", {
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