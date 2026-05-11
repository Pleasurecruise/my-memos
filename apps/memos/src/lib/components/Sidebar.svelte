<script lang="ts">
	import { Button, DatePicker, Separator, cn } from "@my-memos/ui";
	import { updateQuery } from "$lib/utils";
	import { Home, Compass, Archive, Sun, Moon, CalendarDays, X } from "lucide-svelte";
	import type { TagCount } from "$lib/types/memos";

	type NavKey = "home" | "explore" | "archive";

	const NAV_ITEMS: { key: NavKey; label: string; icon: typeof Home }[] = [
		{ key: "home", label: "Home", icon: Home },
		{ key: "explore", label: "Explore", icon: Compass },
		{ key: "archive", label: "Archive", icon: Archive },
	];

	interface SidebarProps {
		tags: TagCount[];
		activeTag: string;
		isDark: boolean;
		onToggleTheme: () => void;
		selectedDate: Date | undefined;
		onDateChange: (date: Date | undefined) => void;
	}

	let { tags, activeTag, isDark, onToggleTheme, selectedDate, onDateChange }: SidebarProps = $props();

	let activeNav = $state<NavKey>("home");

	function handleDateChange(date: Date) {
		if (
			selectedDate &&
			date.getFullYear() === selectedDate.getFullYear() &&
			date.getMonth() === selectedDate.getMonth() &&
			date.getDate() === selectedDate.getDate()
		) {
			onDateChange(undefined);
			updateQuery({ date: undefined });
		} else {
			onDateChange(date);
			updateQuery({ date: formatDateParam(date) });
		}
	}

	function formatDateParam(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	function toggleTag(tag: string) {
		updateQuery({ tag: activeTag === tag ? undefined : tag });
	}

	function clearDate() {
		onDateChange(undefined);
		updateQuery({ date: undefined });
	}
</script>

<aside class="flex flex-col w-60 shrink-0 h-screen border-r border-border bg-background overflow-y-auto">
	<div class="px-5 pt-5 pb-4 shrink-0">
		<span class="flex items-center gap-2 text-accent font-serif font-semibold text-lg tracking-tight select-none">
			<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 20h9" />
				<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
			</svg>
			my memos
		</span>
	</div>

	<nav class="px-3 space-y-0.5 shrink-0">
		{#each NAV_ITEMS as { key, label, icon: Icon } (key)}
			<Button
				variant="ghost"
				size="sm"
				onclick={() => (activeNav = key)}
				class={cn(
					"w-full justify-start gap-2.5 font-normal",
					activeNav === key
						? "bg-accent/10 text-accent hover:bg-accent/10"
						: "text-muted-foreground",
				)}
			>
				<Icon size={15} />
				{label}
			</Button>
		{/each}
	</nav>

	<Separator class="mx-4 my-4 w-auto" />

	<div class="px-4 shrink-0">
		<div class="flex items-center justify-between mb-3">
			<span class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
				<CalendarDays size={12} />
				Filter by date
			</span>
			{#if selectedDate}
				<Button
					variant="ghost"
					size="icon"
					onclick={clearDate}
					class="h-5 w-5 text-muted-foreground"
				>
					<X size={11} />
				</Button>
			{/if}
		</div>
		<DatePicker value={selectedDate} onChange={handleDateChange} />
	</div>

	<Separator class="mx-4 my-4 w-auto" />

	<div class="px-3 flex-1">
		<p class="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
			Tags
		</p>
		<div class="space-y-0.5">
			{#each tags as { name, count } (name)}
				<Button
					variant="ghost"
					size="sm"
					onclick={() => toggleTag(name)}
					class={cn(
						"w-full justify-between font-normal",
						activeTag === name
							? "bg-accent/10 text-accent hover:bg-accent/10"
							: "text-muted-foreground",
					)}
				>
					<span class="flex items-center gap-1.5">
						<span class="text-xs opacity-70">#</span>
						{name}
					</span>
					<span class="text-xs opacity-50">{count}</span>
				</Button>
			{/each}
		</div>
	</div>

	<div class="px-3 py-4 shrink-0 border-t border-border">
		<Button
			variant="ghost"
			size="sm"
			onclick={onToggleTheme}
			class="w-full justify-start gap-2.5 font-normal text-muted-foreground"
		>
			{#if isDark}
				<Sun size={14} />
				Light mode
			{:else}
				<Moon size={14} />
				Dark mode
			{/if}
		</Button>
	</div>
</aside>
