<script lang="ts">
  import { isSameDay } from "date-fns";
  import { updateQuery } from "$lib/utils";
  import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@my-memos/ui";
  import { RotateCcw, Trash2 } from "@lucide/svelte";
  import type { Memo } from "$lib/types";
  import { createDeleteActions, createRestoreActions } from "$lib/state/memo-actions.svelte";
  import MemoCard from "$lib/components/MemoCard.svelte";
  import MarkdownContent from "$lib/components/MarkdownContent.svelte";
  import MemoFilterBar from "$lib/components/MemoFilterBar.svelte";

  interface ArchiveContentProps {
    memos: Memo[];
    initialTags: string[];
    selectedDate: Date | undefined;
  }

  let { memos, initialTags, selectedDate }: ArchiveContentProps = $props();

  const del = createDeleteActions();
  const res = createRestoreActions();

  const filtered = $derived(
    memos.filter((m) => {
      const updatedAt = new Date(m.updatedAt);
      if (selectedDate && !isSameDay(updatedAt, selectedDate)) return false;
      if (initialTags.length > 0 && !initialTags.some((t) => m.tags.includes(t))) return false;
      return true;
    }),
  );

  function toggleCardTag(tag: string) {
    const next = initialTags.includes(tag)
      ? initialTags.filter((t) => t !== tag)
      : [...initialTags, tag];
    updateQuery({ tags: next });
  }
</script>

<div class="max-w-2xl mx-auto px-4 py-8 space-y-5">
  <div class="px-1">
    <p class="text-sm font-medium text-foreground">Archive</p>
    <p class="text-xs text-muted-foreground mt-0.5">
      Archived memos — restore or permanently delete.
    </p>
  </div>

  <MemoFilterBar {selectedDate} activeTags={initialTags} onRemoveTag={toggleCardTag} />

  <div class="space-y-3">
    {#each filtered as memo (memo.id)}
      <MemoCard
        {memo}
        {selectedDate}
        tags={memo.tags}
        activeTags={initialTags}
        onTagClick={toggleCardTag}
      >
        {#snippet content()}
          <MarkdownContent content={memo.content} stripTags class="max-h-48 overflow-y-auto" />
        {/snippet}

        {#snippet actions()}
          <Button
            variant="outline"
            size="sm"
            class="gap-1.5 font-normal text-muted-foreground"
            disabled={res.restoringId === memo.id}
            onclick={() => res.restore(memo.id)}
          >
            <RotateCcw size={12} />
            {res.restoringId === memo.id ? "Restoring…" : "Restore"}
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
        {/snippet}
      </MemoCard>
    {/each}

    {#if filtered.length === 0}
      <p class="text-center py-16 text-muted-foreground text-sm">No archived memos.</p>
    {/if}
  </div>
</div>

<Dialog bind:open={del.showDeleteDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Permanently delete this memo?</DialogTitle>
      <DialogDescription
        >This action cannot be undone. The memo will be permanently removed.</DialogDescription
      >
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onclick={del.cancel} disabled={del.isDeleting}>Cancel</Button>
      <Button variant="destructive" onclick={del.confirm} disabled={del.isDeleting}>
        {del.isDeleting ? "Deleting…" : "Delete"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
