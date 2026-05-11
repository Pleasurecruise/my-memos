<script lang="ts">
	import { onMount } from "svelte";
	import { applyTheme } from "@my-memos/ui";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import MainContent from "$lib/components/MainContent.svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
	let isDark = $state(false);
	let selectedDate = $state<Date | undefined>(undefined);

	$effect(() => {
		selectedDate = data.filters.date ? new Date(`${data.filters.date}T00:00:00`) : undefined;
	});

	onMount(() => {
		const saved = localStorage.getItem("my-memos:theme");
		isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
		applyTheme(isDark);
	});

	$effect(() => {
		if (typeof localStorage !== "undefined") {
			applyTheme(isDark);
			localStorage.setItem("my-memos:theme", isDark ? "dark" : "light");
		}
	});
</script>

<div class="flex h-screen bg-background text-foreground font-sans overflow-hidden">
	<Sidebar
		tags={data.tags}
		activeTag={data.filters.tag}
		{isDark}
		onToggleTheme={() => (isDark = !isDark)}
		{selectedDate}
		onDateChange={(d) => (selectedDate = d)}
	/>
	<main class="flex-1 overflow-y-auto">
		<MainContent
			memos={data.memos}
			initialSearch={data.filters.search}
			initialTag={data.filters.tag}
			{selectedDate}
		/>
	</main>
</div>
