<script lang="ts">
	import { isSameDay } from "date-fns";
	import { invalidateAll } from "$app/navigation";
	import { updateQuery, stripHashtags } from "$lib/utils";
	import { apiCreateMemo } from "$lib/api/memos";
	import { Button, Input, Textarea, Badge, Separator, Alert, AlertDescription } from "@my-memos/ui";
	import { Search, Star, Pencil, Archive, Trash2, X, Check } from "lucide-svelte";
	import type { Memo, MemoVisibility, TagCount } from "$lib/types/memos";
	import { VISIBILITY_CONFIG } from "$lib/memo-config";
	import {
		createDeleteActions,
		createEditActions,
		createPinActions,
		createArchiveActions,
	} from "$lib/stores/memo-actions.svelte";
	import MemoCard from "$lib/components/MemoCard.svelte";
	import FilterBar from "$lib/components/FilterBar.svelte";
	import DeleteDialog from "$lib/components/DeleteDialog.svelte";
	import { createTagAutocomplete } from "$lib/stores/tag-autocomplete.svelte";

	interface MainContentProps {
		memos: Memo[];
		tags: TagCount[];
		initialSearch: string;
		initialTags: string[];
		selectedDate: Date | undefined;
	}

	let { memos, tags, initialSearch, initialTags, selectedDate }: MainContentProps = $props();

	let search = $state("");
	let content = $state("");
	let visibility = $state<MemoVisibility>("public");
	let isSaving = $state(false);
	let error = $state("");

	const currentVisibility = $derived(VISIBILITY_CONFIG[visibility]);
	const CurrentVisibilityIcon = $derived(currentVisibility.icon);

	const del = createDeleteActions();
	const edit = createEditActions();
	const pin = createPinActions();
	const arc = createArchiveActions();

	const filtered = $derived(
		memos.filter((m) => {
			const updatedAt = new Date(m.updatedAt);
			if (selectedDate && !isSameDay(updatedAt, selectedDate)) return false;
			if (initialTags.length > 0 && !initialTags.some((t) => m.tags.includes(t))) return false;
			if (!search) return true;
			return (
				m.content.toLowerCase().includes(search.toLowerCase()) ||
				m.tags.some((t) => t.includes(search.toLowerCase()))
			);
		}),
	);

	const pinned = $derived(filtered.filter((m) => m.pinned));
	const rest = $derived(filtered.filter((m) => !m.pinned));

	function toggleCardTag(tag: string) {
		const next = initialTags.includes(tag)
			? initialTags.filter((t) => t !== tag)
			: [...initialTags, tag];
		updateQuery({ tags: next });
	}

	function cycleVisibility() {
		const options: MemoVisibility[] = ["public", "private"];
		visibility = options[(options.indexOf(visibility) + 1) % options.length];
	}

	function syncSearch(value: string) {
		search = value;
		updateQuery({ search: value.trim() || null });
	}

	async function saveMemo() {
		if (!content.trim() || isSaving) return;
		isSaving = true;
		error = "";
		try {
			await apiCreateMemo(content, visibility);
			content = "";
			search = "";
			await invalidateAll();
		} catch (err) {
			error = err instanceof Error ? err.message : "Failed to save memo.";
		} finally {
			isSaving = false;
		}
	}

	const tagNames = $derived(tags.map((t) => t.name));
	const ac = createTagAutocomplete(() => tagNames);

	$effect(() => {
		search = initialSearch;
	});
</script>

{#snippet renderCard(memo: Memo)}
	{@const isEditing = edit.editingId === memo.id}
	<MemoCard {memo} {selectedDate} hoverActions={!isEditing}>
		{#snippet content()}
			{#if isEditing}
				<Textarea
					value={edit.editContent}
					oninput={(e) => (edit.editContent = (e.target as HTMLTextAreaElement).value)}
					autoresize
					class="border-0 shadow-none rounded-none focus-visible:ring-0 px-0 min-h-0 text-sm"
				/>
			{:else}
				<p class="text-sm text-foreground leading-relaxed whitespace-pre-wrap wrap-break-word">
					{stripHashtags(memo.content)}
				</p>
				{#if memo.tags.length > 0}
					<div class="flex flex-wrap gap-1.5 mt-3">
						{#each memo.tags as tag (tag)}
							<button type="button" onclick={() => toggleCardTag(tag)}>
								<Badge
									variant="outline"
									class={initialTags.includes(tag)
										? "border-accent/50 bg-accent/10 text-accent cursor-pointer"
										: "border-accent/25 text-accent cursor-pointer hover:bg-accent/8"}
								>
									#{tag}
								</Badge>
							</button>
						{/each}
					</div>
				{/if}
			{/if}
		{/snippet}

		{#snippet actions()}
			{#if isEditing}
				<Button
					variant="ghost"
					size="sm"
					class="text-muted-foreground gap-1.5 font-normal"
					onclick={edit.cancel}
				>
					<X size={12} />
					Cancel
				</Button>
				<span class="flex-1"></span>
				<Button
					size="sm"
					class="gap-1.5 font-normal"
					disabled={!edit.editContent.trim() || edit.isUpdating}
					onclick={() => edit.save(memo.id)}
				>
					<Check size={12} />
					{edit.isUpdating ? "Saving..." : "Save"}
				</Button>
			{:else}
				<Button
					variant="ghost"
					size="sm"
					class="gap-1.5 font-normal {memo.pinned ? 'text-accent' : 'text-muted-foreground'}"
					disabled={pin.pinningId === memo.id}
					onclick={() => pin.toggle(memo)}
				>
					<Star size={12} fill={memo.pinned ? "currentColor" : "none"} />
					{memo.pinned ? "Unpin" : "Pin"}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					class="text-muted-foreground gap-1.5 font-normal"
					onclick={() => edit.start(memo)}
				>
					<Pencil size={12} />
					Edit
				</Button>
				<Button
					variant="ghost"
					size="sm"
					class="text-muted-foreground gap-1.5 font-normal"
					disabled={arc.archivingId === memo.id}
					onclick={() => arc.archive(memo.id)}
				>
					<Archive size={12} />
					{arc.archivingId === memo.id ? "Archiving…" : "Archive"}
				</Button>
				<span class="flex-1"></span>
				<Button
					variant="destructive"
					size="sm"
					class="gap-1.5 font-normal"
					onclick={() => del.request(memo.id)}
				>
					<Trash2 size={12} />
					Delete
				</Button>
			{/if}
		{/snippet}
	</MemoCard>
{/snippet}

<div class="max-w-2xl mx-auto px-4 py-8 space-y-5">
	<div class="relative">
		<div class="bg-background border border-border rounded-lg shadow-xs overflow-hidden">
			<Textarea
				value={content}
				oninput={(e) => { content = ac.onInput(e); }}
				onkeydown={(e) => { const next = ac.onKeydown(e); if (next !== null) content = next; if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveMemo(); }}
				onblur={() => setTimeout(() => ac.close(), 150)}
				placeholder="What's on your mind?"
				autoresize
				class="border-0 shadow-none rounded-none focus-visible:ring-0 min-h-20"
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

		{#if ac.open && ac.suggestions.length > 0}
			<div class="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-md z-50 overflow-hidden">
				{#each ac.suggestions as tag, i (tag)}
					<button
						type="button"
						onmousedown={(e) => { e.preventDefault(); content = ac.select(tag) ?? content; }}
						class="w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors {i === ac.activeIndex ? 'bg-accent/10 text-accent' : 'text-foreground hover:bg-muted'}"
					>
						<span class="text-xs opacity-50">#</span>{tag}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if error}
		<Alert variant="error" class="flex items-start gap-2 py-2.5">
			<AlertDescription class="flex-1">{error}</AlertDescription>
			<button onclick={() => (error = "")} class="shrink-0 text-error/60 hover:text-error transition-colors">
				<X size={13} />
			</button>
		</Alert>
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

	<FilterBar
		{selectedDate}
		activeTags={initialTags}
		onRemoveTag={(tag) => updateQuery({ tags: initialTags.filter((t) => t !== tag) })}
	/>

	<div class="space-y-3">
		{#if pinned.length > 0}
			<p class="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Pinned</p>
			{#each pinned as memo (memo.id)}
				{@render renderCard(memo)}
			{/each}
			{#if rest.length > 0}
				<Separator />
			{/if}
		{/if}

		{#each rest as memo (memo.id)}
			{@render renderCard(memo)}
		{/each}

		{#if filtered.length === 0}
			<p class="text-center py-16 text-muted-foreground text-sm">No memos found.</p>
		{/if}
	</div>
</div>

<DeleteDialog
	bind:open={del.showDeleteDialog}
	isDeleting={del.isDeleting}
	onConfirm={del.confirm}
	onCancel={del.cancel}
/>