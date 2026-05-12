<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../../lib/utils";

	let { children, class: extraClass = "", ...rest }: DialogFooterProps = $props();
</script>

<div class={cn("flex flex-row justify-end gap-2 mt-6", extraClass)} {...rest}>
	{@render children?.()}
</div>