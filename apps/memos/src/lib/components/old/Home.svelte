<script lang="ts">
  import { isSameDay } from "date-fns";
  import { invalidateAll } from "$app/navigation";
  import { page } from "$app/state";
  import { updateQuery } from "$lib/utils";
  import { apiCreateMemo } from "$lib/api/memos";
  import { showToast } from "$lib/stores/toast.svelte";
  import {
    Button,
    Input,
    Alert,
    AlertDescription,
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
    Command,
    CommandList,
    CommandItem,
  } from "@my-memos/ui";
  import {
    Search,
    Star,
    Pencil,
    Archive,
    Trash2,
    X,
    Check,
    Clock3,
    Globe,
    Lock,
    Hash,
    ChevronRight,
  } from "@lucide/svelte";
  import type { Memo, MemoVisibility, TagCount } from "$lib/types";
  import {
    createDeleteActions,
    createEditActions,
    createPinActions,
    createArchiveActions,
  } from "$lib/stores/memo-actions.svelte";
  import MemoCard from "$lib/components/MemoCard.svelte";
  import MarkdownContent from "$lib/components/MarkdownContent.svelte";
  import MarkdownEditor from "$lib/components/MarkdownEditor.svelte";
  import FilterBar from "$lib/components/FilterBar.svelte";
  import DeleteDialog from "$lib/components/DeleteDialog.svelte";
  import { createTagAutocomplete } from "$lib/stores/tag-autocomplete.svelte";

  interface MainContentProps {
    memos: Memo[];
    tags: TagCount[];
    initialSearch: string;
    initialTags: string[];
    sortByUpdated: boolean;
    selectedDate: Date | undefined;
  }

  let { memos, tags, initialSearch, initialTags, sortByUpdated, selectedDate }: MainContentProps =
    $props();

  let search = $state("");
  let content = $state("");
  let visibility = $state<MemoVisibility>("private");
  let isSaving = $state(false);
  let pinnedOpen = $state(false);
  let error = $state("");

  const del = createDeleteActions();
  const edit = createEditActions();
  const pin = createPinActions();
  const arc = createArchiveActions();

  const tagNames = $derived(tags.map((t) => t.name));
  const ac = createTagAutocomplete(() => tagNames);

  const visLabel = $derived(visibility === "public" ? "Public" : "Private");
  const showCardResults = $derived(Boolean(search.trim()) || sortByUpdated);
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

  $effect(() => {
    search = initialSearch;
  });

  function toggleCardTag(tag: string) {
    const next = initialTags.includes(tag)
      ? initialTags.filter((t) => t !== tag)
      : [...initialTags, tag];
    updateQuery({ tags: next });
  }

  function cycleVisibility() {
    visibility = visibility === "public" ? "private" : "public";
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
      ac.close();
      content = "";
      search = "";
      await invalidateAll();
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to save memo.";
    } finally {
      isSaving = false;
    }
  }
</script>

{#snippet renderCard(memo: Memo)}
  {@const isEditing = edit.editingId === memo.id}
  <MemoCard
    {memo}
    {selectedDate}
    hoverActions={!isEditing}
    tags={isEditing ? undefined : memo.tags}
    activeTags={initialTags}
    onTagClick={toggleCardTag}
  >
    {#snippet content()}
      {#if isEditing}
        <MarkdownEditor bind:value={edit.editContent} class="-mx-3 -my-1" />
      {:else}
        <MarkdownContent content={memo.content} stripTags class="max-h-48 overflow-y-auto" />
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
        <Button
          variant="outline"
          size="sm"
          class="gap-1.5 font-normal text-muted-foreground"
          onclick={() =>
            (edit.editVisibility = edit.editVisibility === "public" ? "private" : "public")}
        >
          {#if edit.editVisibility === "public"}<Globe size={11} />{:else}<Lock size={11} />{/if}
          {edit.editVisibility === "public" ? "Public" : "Private"}
        </Button>
        <Button
          size="sm"
          class="gap-1.5 font-normal ml-auto"
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
          onclick={() => {
            if (!page.data.user) {
              showToast("error", "Please sign in to archive memos");
              return;
            }
            arc.archive(memo.id);
          }}
        >
          <Archive size={12} />
          {arc.archivingId === memo.id ? "Archiving…" : "Archive"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          class="gap-1.5 font-normal ml-auto"
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
      <MarkdownEditor
        bind:value={content}
        ontextchange={(v) => ac.onValueChange(v)}
        onkeydown={(e) => {
          const next = ac.onKeydown(e);
          if (next !== null) content = next;
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveMemo();
        }}
        placeholder="What's on your mind? Markdown is supported."
        class="min-h-20"
      />
      <div class="flex items-center gap-2 px-3 py-2.5 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onclick={cycleVisibility}
          class="gap-1.5 font-normal text-muted-foreground"
        >
          {#if visibility === "public"}<Globe size={11}></Globe>{:else}<Lock size={11}></Lock>{/if}
          {visLabel}
        </Button>
        <span class="flex-1"></span>
        <span class="text-xs text-muted-foreground opacity-50 hidden sm:inline">⌘ Enter</span>
        <Button size="sm" disabled={!content.trim() || isSaving} onclick={saveMemo}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>

    {#if ac.open && ac.suggestions.length > 0}
      <Command
        bind:activeIndex={ac.activeIndex}
        onselect={(item) => {
          content = ac.select(item.key) ?? content;
        }}
      >
        <CommandList class="absolute top-full left-0 right-0 mt-1 z-50">
          {#each ac.suggestions as tag, i (tag)}
            <CommandItem item={{ key: tag, label: tag }} index={i}>
              <Hash class="h-4 w-4 shrink-0 text-muted-foreground" />
              <span class="truncate">{tag}</span>
            </CommandItem>
          {/each}
        </CommandList>
      </Command>
    {/if}
  </div>

  {#if error}
    <Alert variant="error" class="flex items-start gap-2 py-2.5">
      <AlertDescription class="flex-1">{error}</AlertDescription>
      <button
        onclick={() => (error = "")}
        class="shrink-0 text-error/60 hover:text-error transition-colors"
      >
        <X size={13} />
      </button>
    </Alert>
  {/if}

  <div class="relative">
    <Search
      size={14}
      class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
    />
    <Input
      placeholder="Search memos..."
      value={search}
      oninput={(e) => syncSearch((e.target as HTMLInputElement).value)}
      class="pl-9 pr-10"
    />
    <button
      type="button"
      onclick={() => updateQuery({ sort: sortByUpdated ? null : "updated" })}
      class="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded transition-colors {sortByUpdated
        ? 'bg-accent/10 text-accent hover:bg-accent/10'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
      aria-pressed={sortByUpdated}
      aria-label={sortByUpdated ? "Sort by created time" : "Sort by updated time"}
      title={sortByUpdated ? "Sort by created time" : "Sort by updated time"}
    >
      <Clock3 size={13} />
    </button>
  </div>

  <FilterBar {selectedDate} activeTags={initialTags} onRemoveTag={toggleCardTag} />

  <div class="space-y-3">
    {#if showCardResults}
      {#each filtered as memo (memo.id)}
        {@render renderCard(memo)}
      {/each}
    {:else if pinned.length > 0}
      <Collapsible bind:open={pinnedOpen}>
        <CollapsibleTrigger
          class="pinned-trigger w-fit max-w-full rounded px-0.5 py-px font-mono text-xs leading-5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={pinnedOpen ? "Collapse pinned memos" : "Expand pinned memos"}
        >
          <ChevronRight
            size={14}
            class="shrink-0 transition-transform"
            style={`transform: ${pinnedOpen ? "rotate(90deg)" : "rotate(0deg)"}`}
          />
          <code class="text-foreground">pinned</code>
          <span class="min-w-0 truncate">
            {pinned.length}
            {pinned.length === 1 ? "entry" : "entries"}
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent class="mt-2">
          <div class="space-y-3 pb-1">
            {#each pinned as memo (memo.id)}
              {@render renderCard(memo)}
            {/each}
          </div>
        </CollapsibleContent>
      </Collapsible>
    {/if}

    {#if !showCardResults}
      {#each rest as memo (memo.id)}
        {@render renderCard(memo)}
      {/each}
    {/if}

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
