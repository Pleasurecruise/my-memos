<script lang="ts">
	import { onMount } from "svelte";
	import { loadTheme, persistTheme } from "$lib/theme";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import ArchiveContent from "$lib/components/ArchiveContent.svelte";
	import { Menu } from "lucide-svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
	let isDark = $state(false);
	let selectedDate = $state<Date | undefined>(undefined);
	let sidebarOpen = $state(false);

	$effect(() => {
		selectedDate = data.filters.date ? new Date(`${data.filters.date}T00:00:00`) : undefined;
	});

	onMount(() => {
		isDark = loadTheme();
	});

	$effect(() => {
		if (typeof localStorage !== "undefined") {
			persistTheme(isDark);
		}
	});
</script>

<div class="flex h-screen bg-background text-foreground font-sans overflow-hidden">
	<button
		type="button"
		class={[
			"fixed inset-0 z-30 bg-black/40 md:hidden",
			"transition-opacity duration-200 cursor-default",
			sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
		].join(" ")}
		aria-label="Close sidebar"
		tabindex={sidebarOpen ? 0 : -1}
		onclick={() => (sidebarOpen = false)}
		onkeydown={(e) => e.key === "Escape" && (sidebarOpen = false)}
	></button>

	<Sidebar
		tags={data.tags}
		activeTags={data.filters.tags}
		{isDark}
		open={sidebarOpen}
		onToggleTheme={() => (isDark = !isDark)}
		onClose={() => (sidebarOpen = false)}
		{selectedDate}
		onDateChange={(d) => (selectedDate = d)}
	/>

	<main class="flex-1 overflow-y-auto min-w-0">
		<div class="sticky top-0 z-20 flex items-center gap-3 px-4 h-12 bg-background/95 backdrop-blur-sm border-b border-border md:hidden">
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
				aria-label="Toggle sidebar"
			>
				<Menu size={18} />
			</button>
			<span class="font-serif font-semibold text-accent tracking-tight">my memos</span>
		</div>

		<ArchiveContent
			memos={data.memos}
			initialTags={data.filters.tags}
			{selectedDate}
		/>
	</main>
</div>