<script lang="ts">
  import { MoveUpRight } from "@lucide/svelte";
  import { readMemoSearchResult } from "$lib/chat/memo-search";
  import { stripHashtags } from "$lib/utils";

  let { output }: { output: unknown } = $props();

  const result = $derived(readMemoSearchResult(output));
</script>

{#if result}
  <div class="memo-results" aria-label={`Memo results for ${result.query}`}>
    {#if result.memos.length === 0}
      <p class="empty">No memos found.</p>
    {:else}
      {#each result.memos as memo (memo.id)}
        <article class="memo-result">
          <a class="memo-link" href={`/memo/${memo.id}`} aria-label="Open memo"></a>
          <div class="memo-meta">
            <time datetime={memo.createdAt}>
              {new Date(memo.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
            <span class="open-icon"><MoveUpRight size={12} /></span>
          </div>
          <p class="memo-content">{stripHashtags(memo.content)}</p>
          {#if memo.tags.length > 0}
            <div class="memo-tags">
              {#each memo.tags as tag (tag)}<span>#{tag}</span>{/each}
            </div>
          {/if}
        </article>
      {/each}
    {/if}
  </div>
{/if}

<style>
  .memo-results {
    display: grid;
    gap: 8px;
    margin-block: 4px;
  }

  .memo-result {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-muted);
    padding: 10px 12px;
    transition:
      border-color var(--duration-fast),
      background-color var(--duration-fast);
  }

  .memo-result:hover {
    border-color: var(--color-border-strong);
    background: var(--color-background);
  }

  .memo-link {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .memo-link:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
  }

  .memo-meta,
  .memo-tags {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-muted-foreground);
    font-family: var(--font-mono);
    font-size: 10.5px;
  }

  .open-icon {
    margin-left: auto;
  }

  .memo-content {
    display: -webkit-box;
    overflow: hidden;
    margin: 6px 0 0;
    color: var(--color-foreground);
    font-size: 13px;
    line-height: 1.55;
    white-space: pre-wrap;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }

  .memo-tags {
    flex-wrap: wrap;
    margin-top: 7px;
    color: var(--color-accent);
  }

  .empty {
    margin: 0;
    color: var(--color-muted-foreground);
    font-size: 12px;
  }
</style>
