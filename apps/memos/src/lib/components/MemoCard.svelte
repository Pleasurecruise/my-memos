<script lang="ts">
  import { isToday, isYesterday, isSameDay, format, formatDistanceToNow } from "date-fns";
  import { Badge } from "@my-memos/ui";
  import type { Snippet } from "svelte";
  import { Globe, Lock } from "@lucide/svelte";
  import type { Memo } from "$lib/types";

  interface MemoCardProps {
    memo: Memo;
    selectedDate: Date | undefined;
    hoverActions?: boolean;
    tags?: string[];
    activeTags?: string[];
    onTagClick?: (tag: string) => void;
    content: Snippet;
    actions?: Snippet;
  }

  let {
    memo,
    selectedDate,
    hoverActions = false,
    tags,
    activeTags,
    onTagClick,
    content,
    actions,
  }: MemoCardProps = $props();

  const date = $derived(new Date(memo.createdAt));
  const visLabel = $derived(memo.visibility === "public" ? "Public" : "Private");
  const dateHighlight = $derived(
    !selectedDate || isSameDay(new Date(memo.updatedAt), selectedDate),
  );
</script>

<article
  id="memo-{memo.id}"
  data-memo-id={memo.id}
  class="group relative bg-background border border-border rounded-lg px-5 py-4 shadow-xs hover:shadow-sm hover:border-border-strong transition-all duration-100"
>
  <div class="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
    <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
    <span class="opacity-40">·</span>
    <span class="flex items-center gap-1">
      {#if memo.visibility === "public"}<Globe size={11}></Globe>{:else}<Lock size={11}></Lock>{/if}
      {visLabel}
    </span>
    <span class="flex-1"></span>
    <Badge
      variant={dateHighlight ? "default" : "secondary"}
      class={dateHighlight ? "" : "opacity-50"}
    >
      {isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMM d")}
    </Badge>
  </div>

  {@render content()}

  {#if tags && tags.length > 0}
    <div class="flex flex-wrap gap-1.5 mt-3">
      {#each tags as tag (tag)}
        <button type="button" onclick={() => onTagClick?.(tag)}>
          <Badge
            variant="outline"
            class={activeTags?.includes(tag)
              ? "border-accent/50 bg-accent/10 text-accent cursor-pointer"
              : "border-accent/25 text-accent cursor-pointer hover:bg-accent/8"}
          >
            #{tag}
          </Badge>
        </button>
      {/each}
    </div>
  {/if}

  {#if actions}
    <div
      class="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-border {hoverActions
        ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
        : ''} transition-opacity duration-100"
    >
      {@render actions()}
    </div>
  {/if}
</article>

<style>
  @keyframes memo-glow {
    0% {
      background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
    }
    60% {
      background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
    }
    100% {
      background-color: transparent;
    }
  }

  :global(.memo-highlight) {
    animation: memo-glow 2.5s ease-out forwards;
  }
</style>
