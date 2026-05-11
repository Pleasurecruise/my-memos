<script lang="ts">
	import type { Snippet } from "svelte";

	let { children }: { children: Snippet } = $props();
</script>

<p style="font-family: var(--font-mono); font-size: 11px; color: var(--color-muted-foreground); letter-spacing: 0.08em; text-transform: uppercase;">
	{@render children()}
</p>