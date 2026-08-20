<script lang="ts">
  import { format, isSameDay } from "date-fns";
  import { untrack } from "svelte";
  import { Button } from "@my-memos/ui";
  import { Heart } from "@lucide/svelte";
  import type { Memo } from "$lib/types";
  import { createFavoriteActions } from "$lib/state/memo-actions.svelte";
  import { apiListMemos } from "$lib/services/memos";
  import { showToast } from "$lib/state/toast.svelte";
  import { updateQuery } from "$lib/utils";
  import MarkdownContent from "$lib/components/MarkdownContent.svelte";
  import MemoCard from "$lib/components/MemoCard.svelte";
  import MemoFilterBar from "$lib/components/MemoFilterBar.svelte";
  import XImportForm from "$lib/components/XImportForm.svelte";

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

  const favorite = createFavoriteActions();
  let allMemos = $state(untrack(() => initialMemos));
  let cursor = $state(untrack(() => initialCursor));
  let loadingMore = $state(false);
  let sentinelEl = $state<HTMLDivElement | null>(null);
  let loadRequestSeq = 0;

  $effect(() => {
    allMemos = initialMemos;
    cursor = initialCursor;
    loadingMore = false;
    loadRequestSeq += 1;
  });

  $effect(() => {
    if (!sentinelEl || !cursor) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || !cursor || loadingMore) return;

        loadingMore = true;
        const requestSeq = loadRequestSeq;
        const queryParams = new URLSearchParams({
          cursor,
          limit: "25",
          favoritesOnly: "true",
        });
        if (selectedDate) queryParams.set("date", format(selectedDate, "yyyy-MM-dd"));
        if (initialTags.length > 0) queryParams.set("tags", initialTags.join(","));

        apiListMemos(`/api/memos?${queryParams.toString()}`)
          .then((pageData) => {
            if (requestSeq !== loadRequestSeq) return;
            allMemos = [...allMemos, ...pageData.memos];
            cursor = pageData.nextCursor;
          })
          .catch(() => {
            if (requestSeq !== loadRequestSeq) return;
            showToast("error", "Failed to load more favorite memos");
          })
          .finally(() => {
            if (requestSeq !== loadRequestSeq) return;
            loadingMore = false;
          });
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinelEl);
    return () => observer.disconnect();
  });

  const filtered = $derived(
    allMemos.filter((memo) => {
      if (selectedDate && !isSameDay(new Date(memo.updatedAt), selectedDate)) return false;
      return !(initialTags.length > 0 && !initialTags.some((tag) => memo.tags.includes(tag)));
    }),
  );

  function toggleTag(tag: string) {
    const next = initialTags.includes(tag)
      ? initialTags.filter((activeTag) => activeTag !== tag)
      : [...initialTags, tag];
    updateQuery({ tags: next });
  }
</script>

<div class="max-w-2xl mx-auto px-4 py-8 space-y-5">
  <div class="px-1">
    <p class="text-sm font-medium text-foreground">Favorites</p>
    <p class="text-xs text-muted-foreground mt-0.5">Memos saved for quick access.</p>
  </div>

  <XImportForm />

  <MemoFilterBar {selectedDate} activeTags={initialTags} onRemoveTag={toggleTag} />

  <div class="space-y-3">
    {#each filtered as memo (memo.id)}
      <MemoCard
        {memo}
        {selectedDate}
        tags={memo.tags}
        activeTags={initialTags}
        onTagClick={toggleTag}
      >
        {#snippet content()}
          <MarkdownContent content={memo.content} stripTags class="max-h-48 overflow-y-auto" />
        {/snippet}

        {#snippet actions()}
          <Button
            variant="outline"
            size="sm"
            class="gap-1.5 font-normal text-muted-foreground"
            disabled={favorite.favoritingId === memo.id}
            onclick={() => favorite.toggle(memo)}
          >
            <Heart size={12} fill="currentColor" />
            {favorite.favoritingId === memo.id ? "Removing..." : "Unfavorite"}
          </Button>
        {/snippet}
      </MemoCard>
    {/each}

    {#if filtered.length === 0}
      <p class="text-center py-16 text-muted-foreground text-sm">No favorite memos.</p>
    {/if}

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
