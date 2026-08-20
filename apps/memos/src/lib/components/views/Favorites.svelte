<script lang="ts">
  import { format, isSameDay } from "date-fns";
  import { untrack } from "svelte";
  import { Button } from "@my-memos/ui";
  import { Heart, Lock } from "@lucide/svelte";
  import type { Memo } from "$lib/types";
  import { createFavoriteActions } from "$lib/state/memo-actions.svelte";
  import { apiListMemos } from "$lib/services/memos";
  import { showToast } from "$lib/state/toast.svelte";
  import { groupBy, updateQuery } from "$lib/utils";
  import MarkdownContent from "$lib/components/MarkdownContent.svelte";
  import XImportForm from "$lib/components/XImportForm.svelte";
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
  const grouped = $derived(
    [
      ...groupBy(filtered, (memo) => new Date(memo.createdAt).toISOString().slice(0, 7)).entries(),
    ].sort((a, b) => b[0].localeCompare(a[0])),
  );

  function toggleTag(tag: string) {
    const next = initialTags.includes(tag)
      ? initialTags.filter((activeTag) => activeTag !== tag)
      : [...initialTags, tag];
    updateQuery({ tags: next });
  }
</script>

<div class="min-h-screen bg-background text-foreground font-sans">
  <div class="max-w-280 mx-auto px-4 sm:px-8 pb-24 pt-7">
    <Masthead />

    <div class="max-w-180 mx-auto mb-8">
      <div class="relative inline-block">
        <h1 class="font-serif font-semibold text-7 text-foreground leading-none">favorites</h1>
        <span class="absolute left-0 -bottom-1.5 h-0.5 w-8 rounded-sm bg-accent"></span>
      </div>
      <p class="text-sm text-muted-foreground mt-4">Memos saved for quick access.</p>
    </div>

    <div class="max-w-180 mx-auto space-y-10">
      <XImportForm />

      {#each grouped as [monthKey, items] (monthKey)}
        <section>
          <div class="flex items-center gap-4 mb-4">
            <h2 class="font-serif font-semibold text-lg text-foreground shrink-0">
              {new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div class="flex-1 h-px bg-border"></div>
            <span class="font-mono text-[11px] text-muted-foreground shrink-0"
              >{items.length} entries</span
            >
          </div>

          <div class="space-y-2">
            {#each items as memo (memo.id)}
              <div
                class="group px-3.5 py-3 rounded-md
                  border border-transparent hover:border-border hover:bg-muted transition-colors"
              >
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="font-mono text-[11px] text-muted-foreground">
                    {new Date(memo.createdAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
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

                <div
                  class="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border
                    memo-hover-actions transition-opacity"
                >
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
                </div>
              </div>
            {/each}
          </div>
        </section>
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
</div>
