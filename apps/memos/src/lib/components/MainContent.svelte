<script lang="ts">
	import { isToday, isYesterday, isSameDay, format, formatDistanceToNow } from "date-fns";
	import { invalidateAll } from "$app/navigation";
	import { updateQuery } from "$lib/utils";
	import { Button, Input, Textarea, Badge, Separator } from "@my-memos/ui";
	import { Search, Globe, Users, Lock, Star, Pencil, Archive, Trash2 } from "lucide-svelte";
	import type { Memo, MemoVisibility } from "$lib/types/memos";

	const VISIBILITY_CONFIG: Record<MemoVisibility, { label: string; icon: typeof Globe }> = {
		public: { label: "Public", icon: Globe },
		protected: { label: "Protected", icon: Users },
		private: { label: "Private", icon: Lock },
	};

	interface MainContentProps {
		memos: Memo[];
		initialSearch: string;
		initialTag: string;
		selectedDate: Date | undefined;
	}

	let { memos, initialSearch, initialTag, selectedDate }: MainContentProps = $props();

	let search = $state("");
	let content = $state("");
	let visibility = $state<MemoVisibility>("public");
	let isSaving = $state(false);
	let error = $state("");
	let currentVisibility = $derived(VISIBILITY_CONFIG[visibility]);
	let CurrentVisibilityIcon = $derived(currentVisibility.icon);

	const filtered = $derived(
		memos.filter((m) => {
			const createdAt = new Date(m.createdAt);
			if (selectedDate && !isSameDay(createdAt, selectedDate)) return false;
			if (initialTag && !m.tags.includes(initialTag)) return false;
			if (!search) return true;
			return (
				m.content.toLowerCase().includes(search.toLowerCase()) ||
				m.tags.some((t) => t.includes(search.toLowerCase()))
			);
		}),
	);

	const pinned = $derived(filtered.filter((m) => m.pinned));
	const rest = $derived(filtered.filter((m) => !m.pinned));

	function cycleVisibility() {
		const options: MemoVisibility[] = ["public", "protected", "private"];
		visibility = options[(options.indexOf(visibility) + 1) % options.length];
	}

	function syncSearch(value: string) {
		search = value;
		updateQuery({ search: value.trim() || undefined });
	}

	async function saveMemo() {
		if (!content.trim() || isSaving) return;

		isSaving = true;
		error = "";

		try {
			const response = await fetch("/api/memos", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					content,
					visibility,
				}),
			});

			if (!response.ok) {
				const payload = (await response.json()) as { error?: string };
				throw new Error(payload.error ?? "Failed to save memo.");
			}

			content = "";
			search = "";
			await invalidateAll();
		} catch (err) {
			error = err instanceof Error ? err.message : "Failed to save memo.";
		} finally {
			isSaving = false;
		}
	}

	$effect(() => {
		search = initialSearch;
	});
</script>

{#snippet memoCard(memo: Memo, dateHighlight: boolean)}
	{@const date = new Date(memo.createdAt)}
	{@const vis = VISIBILITY_CONFIG[memo.visibility]}
	{@const VisIcon = vis.icon}
	<article class="group relative bg-background border border-border rounded-lg px-5 py-4 shadow-xs hover:shadow-sm hover:border-border-strong transition-all duration-100">
		{#if memo.pinned}
			<span class="absolute top-3.5 right-4 text-accent opacity-50">
				<Star size={12} fill="currentColor" />
			</span>
		{/if}

		<div class="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
			<span>{formatDistanceToNow(date, { addSuffix: true })}</span>
			<span class="opacity-40">·</span>
			<span class="flex items-center gap-1">
				<VisIcon size={11} />
				{vis.label}
			</span>
			<span class="flex-1"></span>
			<Badge
				variant={dateHighlight ? "default" : "secondary"}
				class={dateHighlight ? "" : "opacity-50"}
			>
				{isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMM d")}
			</Badge>
		</div>

		<p class="text-sm text-foreground leading-relaxed whitespace-pre-wrap wrap-break-word">
			{memo.content}
		</p>

		{#if memo.tags.length > 0}
			<div class="flex flex-wrap gap-1.5 mt-3">
				{#each memo.tags as tag (tag)}
					<Badge variant="outline" class="border-accent/25 text-accent cursor-pointer hover:bg-accent/8">
						#{tag}
					</Badge>
				{/each}
			</div>
		{/if}

		<div class="flex items-center gap-1 mt-4 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity duration-100">
			<Button variant="ghost" size="sm" class="text-muted-foreground gap-1.5 font-normal">
				<Star size={12} />
				Pin
			</Button>
			<Button variant="ghost" size="sm" class="text-muted-foreground gap-1.5 font-normal">
				<Pencil size={12} />
				Edit
			</Button>
			<Button variant="ghost" size="sm" class="text-muted-foreground gap-1.5 font-normal">
				<Archive size={12} />
				Archive
			</Button>
			<span class="flex-1"></span>
			<Button variant="destructive" size="sm" class="gap-1.5 font-normal">
				<Trash2 size={12} />
				Delete
			</Button>
		</div>
	</article>
{/snippet}

<div class="max-w-2xl mx-auto px-4 py-8 space-y-5">
	<div class="bg-background border border-border rounded-lg shadow-xs overflow-hidden">
		<Textarea
			value={content}
			oninput={(e) => (content = (e.target as HTMLTextAreaElement).value)}
			placeholder="What's on your mind?"
			class="border-0 shadow-none rounded-none focus-visible:ring-0 resize-none min-h-20"
		/>
		<div class="flex items-center gap-2 px-3 py-2.5 border-t border-border">
			<Button
				variant="outline"
				size="sm"
				onclick={cycleVisibility}
				class="gap-1.5 font-normal text-muted-foreground"
			>
				<CurrentVisibilityIcon size={11} />
				{currentVisibility.label}
			</Button>
			<span class="flex-1"></span>
			<span class="text-xs text-muted-foreground opacity-50 hidden sm:inline">⌘ Enter</span>
			<Button size="sm" disabled={!content.trim() || isSaving} onclick={saveMemo}>
				{isSaving ? "Saving..." : "Save"}
			</Button>
		</div>
	</div>

	{#if error}
		<p class="px-1 text-sm text-error">{error}</p>
	{/if}

	<div class="relative">
		<Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
		<Input
			placeholder="Search memos..."
			value={search}
			oninput={(e) => syncSearch((e.target as HTMLInputElement).value)}
			class="pl-9"
		/>
	</div>

	{#if selectedDate}
		<p class="text-xs text-muted-foreground px-1">
			Showing memos from
			<span class="text-accent font-medium">
				{selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
			</span>
		</p>
	{/if}

	<div class="space-y-3">
		{#if pinned.length > 0}
			<p class="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
				Pinned
			</p>
			{#each pinned as memo (memo.id)}
				{@render memoCard(memo, !selectedDate || isSameDay(new Date(memo.createdAt), selectedDate))}
			{/each}
			{#if rest.length > 0}
				<Separator />
			{/if}
		{/if}
		{#each rest as memo (memo.id)}
			{@render memoCard(memo, !selectedDate || isSameDay(new Date(memo.createdAt), selectedDate))}
		{/each}
		{#if filtered.length === 0}
			<p class="text-center py-16 text-muted-foreground text-sm">No memos found.</p>
		{/if}
	</div>
</div>
