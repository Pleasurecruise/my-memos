<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	export interface TableProps extends HTMLAttributes<HTMLTableElement> {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "../../lib/utils";

	let { class: extraClass = "", children, ...rest }: TableProps = $props();
</script>

<div class="w-full overflow-x-auto">
	<table class={cn("w-full caption-bottom font-sans text-sm", extraClass)} {...rest}>
		{@render children?.()}
	</table>
</div>