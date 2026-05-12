<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { Button, DatePicker, Separator, Tooltip, cn } from "@my-memos/ui";
	import { format } from "date-fns";
	import { updateQuery } from "$lib/utils";
	import { Home, Archive, Sun, Moon, CalendarDays, X, PenLine } from "lucide-svelte";
	import type { TagCount } from "$lib/types/memos";

	const NAV_ITEMS = [
		{ href: "/", label: "Home", icon: Home },
		{ href: "/archive", label: "Archive", icon: Archive },
	] as const;

	interface SidebarProps {
		tags: TagCount[];
		activeTags: string[];
		isDark: boolean;
		open: boolean;
		onToggleTheme: () => void;
		onClose: () => void;
		selectedDate: Date | undefined;
		onDateChange: (date: Date | undefined) => void;
	}

	let {
		tags,
		activeTags,
		isDark,
		open,
		onToggleTheme,
		onClose,
		selectedDate,
		onDateChange,
	}: SidebarProps = $props();

	function handleDateChange(date: Date) {
		if (
			selectedDate &&
			date.getFullYear() === selectedDate.getFullYear() &&
			date.getMonth() === selectedDate.getMonth() &&
			date.getDate() === selectedDate.getDate()
		) {
			onDateChange(undefined);
			updateQuery({ date: null });
		} else {
			onDateChange(date);
			updateQuery({ date: format(date, "yyyy-MM-dd") });
		}
	}

	function toggleTag(tag: string) {
		const next = activeTags.length === 1 && activeTags[0] === tag ? [] : [tag];
		updateQuery({ tags: next });
	}

	function clearDate() {
		onDateChange(undefined);
		updateQuery({ date: null });
	}
</script>

<aside
	class={cn(
		"fixed inset-y-0 left-0 z-40 md:relative md:z-auto",
		"flex flex-col w-60 shrink-0 h-screen border-r border-border bg-background overflow-y-auto",
		"transition-transform duration-200 ease-in-out",
		!open && "-translate-x-full md:translate-x-0",
	)}
>
	<div class="px-5 pt-5 pb-4 shrink-0 flex items-center justify-between">
		<span class="flex items-center gap-2 text-accent font-serif font-semibold text-lg tracking-tight select-none">
			<PenLine size={17} strokeWidth={1.8} />
			my memos
		</span>
		<Tooltip content="Close sidebar" side="right">
			<Button
				variant="ghost"
				size="icon"
				onclick={onClose}
				class="h-7 w-7 text-muted-foreground md:hidden"
			>
				<X size={15} />
			</Button>
		</Tooltip>
	</div>

	<nav class="px-3 space-y-0.5 shrink-0">
		{#each NAV_ITEMS as { href, label, icon: Icon } (href)}
			{@const active = $page.url.pathname === href}
			<Button
				variant="ghost"
				size="sm"
				onclick={() => goto(href)}
				class={cn(
					"w-full justify-start gap-2.5 font-normal",
					active ? "bg-accent/10 text-accent hover:bg-accent/10" : "text-muted-foreground",
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
				<Tooltip content="Clear date filter" side="right">
					<Button
						variant="ghost"
						size="icon"
						onclick={clearDate}
						class="h-5 w-5 text-muted-foreground"
					>
						<X size={11} />
					</Button>
				</Tooltip>
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
						activeTags.includes(name)
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
		<Tooltip content={isDark ? "Switch to light mode" : "Switch to dark mode"} side="top">
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
		</Tooltip>
	</div>
</aside>