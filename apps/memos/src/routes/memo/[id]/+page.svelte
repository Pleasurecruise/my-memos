<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import MarkdownContent from "#lib/components/MarkdownContent.svelte";
  import type { Memo } from "#lib/types.ts";

  let { data }: { data: { memo: Memo } } = $props();

  onMount(() => {
    void goto(`/#memo-${data.memo.id}`, {
      replace: true,
      reset: false,
    });
  });
</script>

<main class="mx-auto max-w-2xl px-4 py-10">
  <article>
    <header class="mb-4 text-sm text-muted-foreground">
      <time datetime={data.memo.createdAt}>{data.memo.createdAt.slice(0, 10)}</time>
      {#if data.memo.tags.length > 0}
        <ul class="mt-1 flex flex-wrap gap-2" aria-label="Tags">
          {#each data.memo.tags as tag (tag)}
            <li><a href={`/?tags=${encodeURIComponent(tag)}`}>#{tag}</a></li>
          {/each}
        </ul>
      {/if}
    </header>
    <MarkdownContent content={data.memo.content} stripTags />
  </article>
  <nav class="mt-8 text-sm"><a href="/">← My Memos</a></nav>
</main>
