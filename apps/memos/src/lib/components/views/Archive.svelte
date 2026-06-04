<script lang="ts">
  import { isSameDay, format } from "date-fns";
  import { updateQuery, groupBy } from "$lib/utils";
  import { untrack } from "svelte";
  import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@my-memos/ui";
  import { RotateCcw, Trash2, Lock } from "@lucide/svelte";
  import type { Memo } from "$lib/types";
  import { createDeleteActions, createRestoreActions } from "$lib/state/memo-actions.svelte";
  import { showToast } from "$lib/state/toast.svelte";
  import MarkdownContent from "$lib/components/MarkdownContent.svelte";

  import Masthead from "$lib/components/layout/Masthead.svelte";

  interface Props {
    memos: Memo[];
    nextCursor: string | null;
    initialTags: string[];
    selectedDate: Date | undefined;
  }

  let {
    memos: initialMemos,
    nextCursor: initialCursor,
    initialTags,
    selectedDate,
  }: Props = $props();

  const del = createDeleteActions();
  const res = createRestoreActions();

  let allMemos = $state(untrack(() => initialMemos));
  let cursor = $state(untrack(() => initialCursor));
  let loadingMore = $state(false);
  let sentinelEl = $state<HTMLDivElement | null>(null);
  let loadRequestSeq = 0;

  // Reset when initial data changes
  $effect(() => {
    allMemos = initialMemos;
    cursor = initialCursor;
    loadingMore = false;
    loadRequestSeq += 1;
  });

  // Infinite scroll
  $effect(() => {
    if (!sentinelEl || !cursor) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && cursor && !loadingMore) {
          loadingMore = true;
          const requestSeq = loadRequestSeq;
          const queryParams = new URLSearchParams({ cursor, limit: "25", archivedOnly: "true" });
          if (selectedDate) queryParams.set("date", format(selectedDate, "yyyy-MM-dd"));
          if (initialTags.length > 0) queryParams.set("tags", initialTags.join(","));

          fetch(`/api/memos?${queryParams.toString()}`)
            .then((response) => {
              if (!response.ok) throw new Error("Bad response");
              return response.json();
            })
            .then((pageData) => {
              if (requestSeq !== loadRequestSeq) return;
              allMemos = [...allMemos, ...pageData.memos];
              cursor = pageData.nextCursor;
            })
            .catch(() => {
              if (requestSeq !== loadRequestSeq) return;
              showToast("error", "Failed to load more archived memos");
            })
            .finally(() => {
              if (requestSeq !== loadRequestSeq) return;
              loadingMore = false;
            });
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinelEl);
    return () => observer.disconnect();
  });

  const memos = $derived(allMemos);
  const filtered = $derived(
    memos.filter((m) => {
      const updatedAt = new Date(m.updatedAt);
      if (selectedDate && !isSameDay(updatedAt, selectedDate)) return false;
      return !(initialTags.length > 0 && !initialTags.some((t) => m.tags.includes(t)));
    }),
  );
  const grouped = $derived(groupByMonth(filtered));

  function groupByMonth(items: Memo[]) {
    return [
      ...groupBy(items, (m) => new Date(m.createdAt).toISOString().slice(0, 7)).entries(),
    ].sort((a, b) => b[0].localeCompare(a[0]));
  }

  function monthLabel(iso: string) {
    const [year, month] = iso.split("-").map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function dateLabel(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  function toggleTag(tag: string) {
    const next = initialTags.includes(tag)
      ? initialTags.filter((t) => t !== tag)
      : [...initialTags, tag];
    updateQuery({ tags: next });
  }
</script>

<div class="min-h-screen bg-background text-foreground font-sans">
  <div class="max-w-280 mx-auto px-4 sm:px-8 pb-24 pt-7">
    <Masthead />

    <!-- Page heading -->
    <div class="max-w-180 mx-auto mb-8">
      <div class="relative inline-block">
        <h1 class="font-serif font-semibold text-7 text-foreground leading-none">archive</h1>
        <span class="absolute left-0 -bottom-1.5 h-0.5 w-8 rounded-sm bg-accent"></span>
      </div>
      <p class="text-sm text-muted-foreground mt-4">
        Archived memos — restore or permanently delete.
      </p>
    </div>

    <!-- Archive list -->
    <div class="max-w-180 mx-auto space-y-10">
      {#each grouped as [monthKey, items] (monthKey)}
        <section>
          <!-- Month header -->
          <div class="flex items-center gap-4 mb-4">
            <h2 class="font-serif font-semibold text-lg text-foreground shrink-0">
              {monthLabel(monthKey)}
            </h2>
            <div class="flex-1 h-px bg-border"></div>
            <span class="font-mono text-[11px] text-muted-foreground shrink-0"
              >{items.length} entries</span
            >
          </div>

          <!-- Entries -->
          <div class="space-y-2">
            {#each items as memo (memo.id)}
              <div
                class="group px-3.5 py-3 rounded-md
                  border border-transparent hover:border-border hover:bg-muted transition-colors"
              >
                <!-- Meta row -->
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="font-mono text-[11px] text-muted-foreground">
                    {dateLabel(memo.createdAt)}
                  </span>
                  {#if memo.visibility === "private"}
                    <Lock size={10} class="text-muted-foreground opacity-50" />
                  {/if}
                </div>

                <MarkdownContent
                  content={memo.content}
                  stripTags
                  class="max-h-48 overflow-y-auto text-sm leading-relaxed"
                />

                {#if memo.tags.length > 0}
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    {#each memo.tags as tag (tag)}
                      <button
                        type="button"
                        onclick={() => toggleTag(tag)}
                        class="inline-flex items-center gap-0.5 px-2 py-px rounded-full text-[11px]
                          border border-accent/25 text-accent hover:bg-accent/8 transition-colors"
                      >
                        <span class="opacity-50">#</span>{tag}
                      </button>
                    {/each}
                  </div>
                {/if}

                <!-- Hover actions -->
                <div
                  class="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border
                    opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    class="gap-1.5 font-normal text-muted-foreground"
                    disabled={res.restoringId === memo.id}
                    onclick={() => res.restore(memo.id)}
                  >
                    <RotateCcw size={12} />
                    {res.restoringId === memo.id ? "Restoring..." : "Restore"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    class="gap-1.5 font-normal ml-auto"
                    onclick={() => del.request(memo.id)}
                  >
                    <Trash2 size={12} />Delete
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        </section>
      {/each}

      {#if filtered.length === 0}
        <p class="text-center py-16 text-muted-foreground text-sm">No archived memos.</p>
      {/if}

      <!-- sentinel for infinite scroll -->
      {#if cursor}
        <div bind:this={sentinelEl} class="h-4">
          {#if loadingMore}
            <div class="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
              <span
                class="inline-block w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin"
              ></span>
              loading...
            </div>
          {/if}
        </div>
      {/if}
    </div>
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
