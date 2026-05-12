<script lang="ts">
  import AppShell from "$lib/components/AppShell.svelte";
  import MainContent from "$lib/components/MainContent.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let selectedDate = $state<Date | undefined>(undefined);

  $effect(() => {
    selectedDate = data.filters.date ? new Date(`${data.filters.date}T00:00:00`) : undefined;
  });
</script>

<AppShell
  tags={data.tags}
  activeTags={data.filters.tags}
  {selectedDate}
  onDateChange={(d) => (selectedDate = d)}
>
  <MainContent
    memos={data.memos}
    tags={data.tags}
    initialSearch={data.filters.search}
    initialTags={data.filters.tags}
    {selectedDate}
  />
</AppShell>
