<script lang="ts">
  import { onMount } from "svelte";
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import OldHome from "$lib/components/views-legacy/Home.svelte";
  import NewHome from "$lib/components/views/Home.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let selectedDate = $state<Date | undefined>(undefined);
  let layout = $state<"old" | "new">("new");

  const LAYOUT_KEY = "my-memos:layout";

  onMount(() => {
    const saved = localStorage.getItem(LAYOUT_KEY);
    layout = saved === "old" ? "old" : "new";
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
    viewAsPublic={data.filters.viewAsPublic}
    {selectedDate}
    onDateChange={(d) => (selectedDate = d)}
  >
    <OldHome
      memos={data.memos}
      tags={data.tags}
      initialSearch={data.filters.search}
      initialTags={data.filters.tags}
      sortByUpdated={data.filters.sortByUpdated}
      {selectedDate}
    />
  </AppShell>
{:else}
  <NewHome
    memos={data.memos}
    activityMemos={data.activityMemos}
    tags={data.tags}
    initialSearch={data.filters.search}
    initialTags={data.filters.tags}
    viewAsPublic={data.filters.viewAsPublic}
    sortByUpdated={data.filters.sortByUpdated}
    {selectedDate}
  />
{/if}

<!-- layout toggle pill -->
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
  {#if layout === "old"}
    new →
  {:else}
    ← classic
  {/if}
</button>
