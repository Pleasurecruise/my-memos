<script module lang="ts">
	import type { HTMLAttributes } from "svelte/elements";

	export interface DropdownMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {}
</script>

<script lang="ts">
	import { cn } from "../../lib/utils";

	let { class: extraClass = "", ...rest }: DropdownMenuSeparatorProps = $props();
</script>

<div role="separator" class={cn("-mx-1 my-1 h-px bg-border", extraClass)} {...rest}></div>