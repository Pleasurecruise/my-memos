<script lang="ts">
  import { onMount } from "svelte";
  import OldChat from "$lib/components/views-legacy/Chat.svelte";
  import NewChat from "$lib/components/views/Chat.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let layout = $state<"old" | "new">("new");

  const LAYOUT_KEY = "my-memos:layout";

  onMount(() => {
    const saved = localStorage.getItem(LAYOUT_KEY);
    layout = saved === "old" ? "old" : "new";
  });

  function toggleLayout() {
    layout = layout === "old" ? "new" : "old";
    localStorage.setItem(LAYOUT_KEY, layout);
  }
</script>

{#if layout === "old"}
  <OldChat user={data.user} />
{:else}
  <NewChat user={data.user} />
{/if}

<button
  type="button"
  onclick={toggleLayout}
  class="fixed bottom-5 right-5 z-50 inline-flex items-center gap-1.5
    h-7 px-3 rounded-full border border-border bg-background shadow-sm
    font-mono text-[11px] text-muted-foreground
    hover:text-foreground hover:border-border-strong hover:shadow-md
    transition-all"
  title="Switch layout"
>
  {#if layout === "old"}new →{:else}← classic{/if}
</button>
