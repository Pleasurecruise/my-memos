<script lang="ts">
	import type { Component } from "svelte";
	import { applyTheme } from "../src";

	type DemoModule = { title?: string; default: Component };

	const modules = import.meta.glob<DemoModule>("./demos/*.svelte", { eager: true });

	const demos = Object.entries(modules)
		.map(([path, mod]) => {
			const id = path.slice("./demos/".length, -".svelte".length);
			return { id, title: mod.title ?? id, Component: mod.default };
		})
		.sort((a, b) => a.title.localeCompare(b.title));

	let activeId = $state(demos[0]?.id ?? "");
	let dark = $state(false);

	const active = $derived(demos.find((d) => d.id === activeId));

	function toggleTheme() {
		dark = !dark;
		applyTheme(dark);
	}
</script>

<div class="layout">
	<aside class="sidebar">
		<div class="sidebar-top">
			<span class="wordmark">ui</span>
			<button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
				{dark ? "○" : "●"}
			</button>
		</div>
		<nav class="nav">
			{#each demos as d (d.id)}
				<button
					class="nav-btn {d.id === activeId ? 'active' : ''}"
					onclick={() => (activeId = d.id)}
				>
					{d.title}
				</button>
			{/each}
		</nav>
	</aside>
	<main class="canvas">
		{#if active}
			{@const DemoComponent = active.Component}
			<DemoComponent />
		{:else}
			<p class="empty">No demos yet — add a file to dev/demos/</p>
		{/if}
	</main>
</div>