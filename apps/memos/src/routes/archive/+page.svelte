<script lang="ts">
  import { onMount } from "svelte";
  import AppShell from "$lib/components/old/AppShell.svelte";
  import OldArchive from "$lib/components/old/Archive.svelte";
  import NewArchive from "$lib/components/new/Archive.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let selectedDate = $state<Date | undefined>(undefined);
  let layout = $state<"old" | "new">("new");

  const LAYOUT_KEY = "my-memos:layout";

  onMount(() => {
    const saved = localStorage.getItem(LAYOUT_KEY) as "old" | "new" | null;
    layout = saved ?? "new";
  });

  $effect(() => {
    selectedDate = data.filters.date ? new Date(`${data.filters.date}T00:00:00`) : undefined;
  });

  function toggleLayout() {
    layout = layout === "old" ? "new" : "old";
    localStorage.setItem(LAYOUT_KEY, layout);
  }
</script>

{#if layout === "old"}
  <AppShell
    tags={data.tags}
    activeTags={data.filters.tags}
    {selectedDate}
    onDateChange={(d) => (selectedDate = d)}
  >
    <OldArchive memos={data.memos} initialTags={data.filters.tags} {selectedDate} />
  </AppShell>
{:else}
  <NewArchive memos={data.memos} initialTags={data.filters.tags} {selectedDate} />
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
